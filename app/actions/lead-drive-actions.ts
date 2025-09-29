"use server";

import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { GoogleDriveService, ExtendedDriveFile } from "@/lib/services/googleDrive";
import { revalidatePath } from "next/cache";

// Define Google Drive API base URL
const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

// Interface for Drive files returned to client
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string;
  iconLink?: string;
  modifiedTime: string;
  size?: string;
  source: 'drive';
}

export async function getLeadDriveFolderIdServerAction(leadId: string): Promise<string | null> {
  if (!leadId) {
    console.log("[Server Action] getLeadDriveFolderIdServerAction: No leadId provided.");
    return null;
  }
  console.log(`[Server Action] getLeadDriveFolderIdServerAction: Fetching Drive Folder ID for lead: ${leadId}`);
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { googleDriveFolderId: true },
    });
    if (lead) {
      console.log(`[Server Action] getLeadDriveFolderIdServerAction: Found googleDriveFolderId: ${lead.googleDriveFolderId} for lead: ${leadId}`);
      return lead.googleDriveFolderId || null;
    } else {
      console.log(`[Server Action] getLeadDriveFolderIdServerAction: Lead not found for ID: ${leadId}`);
      return null;
    }
  } catch (error) {
    console.error(`[Server Action] getLeadDriveFolderIdServerAction: Error fetching Google Drive folder ID for lead ${leadId}:`, error);
    // Consider how you want to handle errors. Returning null might be acceptable,
    // or you might want to throw the error to be caught by the calling client component.
    return null; 
  }
} 

export async function fetchDriveFilesServerAction(folderId: string): Promise<{ success: boolean; files: DriveFile[]; message?: string }> {
  if (!folderId) {
    console.error("[Server Action] fetchDriveFilesServerAction: No folderId provided.");
    return { success: false, files: [], message: "Folder ID is required." };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.accessToken) {
    console.error("[Server Action] fetchDriveFilesServerAction: User not authenticated or access token missing.");
    return { success: false, files: [], message: "Authentication required." };
  }

  console.log(`[Server Action] fetchDriveFilesServerAction: Fetching files from Drive folder: ${folderId}`);
  try {
    const driveService = new GoogleDriveService({ accessToken: session.accessToken });
    
    // First try a direct test call to verify the access token works
    try {
      console.log("[Server Action] fetchDriveFilesServerAction: Verifying token by fetching user info");
      const testResponse = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      });
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log("[Server Action] fetchDriveFilesServerAction: Token validation successful", 
          data?.user?.emailAddress ? `(${data.user.emailAddress})` : '');
      } else {
        console.error("[Server Action] fetchDriveFilesServerAction: Token validation failed", 
          await testResponse.text());
      }
    } catch (tokenErr) {
      console.error("[Server Action] fetchDriveFilesServerAction: Error validating token:", tokenErr);
      // Continue despite token verification error
    }
    
    // Make the files request with simple fields first to troubleshoot
    const filesResult = await driveService.listFilesInFolder(folderId, {
      fields: 'files(id,name,mimeType)'
    });

    console.log(`[Server Action] fetchDriveFilesServerAction: Drive API result success: ${filesResult.success}, files count: ${filesResult.data?.length || 0}`);
    
    if (filesResult.success && filesResult.data) {
      const formattedFiles: DriveFile[] = filesResult.data.map(file => {
        // Format for display with fallbacks for all possibly undefined fields
        const now = new Date().toISOString();
        
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          thumbnailLink: file.thumbnailLink,
          iconLink: file.iconLink || '/google-drive-icon.svg',
          modifiedTime: file.modifiedTime || now,
          size: file.size ? `${Math.round(parseInt(file.size) / 1024)} KB` : 'Unknown size',
          source: 'drive' as const
        };
      });

      console.log(`[Server Action] fetchDriveFilesServerAction: Successfully formatted ${formattedFiles.length} files from Drive folder ${folderId}`);
      if (formattedFiles.length > 0) {
        console.log(`[Server Action] Sample file:`, JSON.stringify(formattedFiles[0], null, 2));
      }
      
      return { success: true, files: formattedFiles };
    } else {
      console.error(`[Server Action] fetchDriveFilesServerAction: Failed to fetch files from Drive folder ${folderId}. Message: ${filesResult.message}`);
      return { success: false, files: [], message: filesResult.message || "Failed to fetch files from Google Drive folder." };
    }
  } catch (error: any) {
    console.error(`[Server Action] fetchDriveFilesServerAction: Error fetching files from Drive folder ${folderId}:`, error);
    return { success: false, files: [], message: error.message || "An unexpected error occurred." };
  }
}

export async function ensureLeadDriveFolderServerAction(leadId: string): Promise<{ success: boolean; folderId?: string | null; message?: string }> {
  if (!leadId) {
    console.error("[Server Action] ensureLeadDriveFolderServerAction: No leadId provided.");
    return { success: false, message: "Lead ID is required." };
  }

  const session = await getServerSession(authOptions); // Need to import getServerSession and authOptions
  if (!session?.user?.id || !session.accessToken) {
    console.error("[Server Action] ensureLeadDriveFolderServerAction: User not authenticated or access token missing.");
    return { success: false, message: "Authentication required." };
  }

  console.log(`[Server Action] ensureLeadDriveFolderServerAction: Processing for lead: ${leadId}`);
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, firstName: true, lastName: true, googleDriveFolderId: true },
    });

    if (!lead) {
      console.error(`[Server Action] ensureLeadDriveFolderServerAction: Lead not found for ID: ${leadId}`);
      return { success: false, message: "Lead not found." };
    }

    if (lead.googleDriveFolderId) {
      console.log(`[Server Action] ensureLeadDriveFolderServerAction: Drive folder already exists for lead ${leadId}: ${lead.googleDriveFolderId}`);
      return { success: true, folderId: lead.googleDriveFolderId };
    }

    const parentFolderId = process.env.GOOGLE_DRIVE_LEADS_PARENT_FOLDER_ID;
    if (!parentFolderId) {
      console.error("[Server Action] ensureLeadDriveFolderServerAction: GOOGLE_DRIVE_LEADS_PARENT_FOLDER_ID is not set.");
      return { success: false, message: "Server configuration error: Parent Drive folder ID missing." };
    }

    const driveService = new GoogleDriveService({ accessToken: session.accessToken });
    const folderName = `Lead: ${lead.firstName || 'N/A'} ${lead.lastName || 'N/A'} - ID ${lead.id}`.replace(/[\\/:"*?<>|]/g, '_');
    
    console.log(`[Server Action] ensureLeadDriveFolderServerAction: Creating Google Drive folder "${folderName}" for lead ${leadId}`);
    const folderResult = await driveService.createFolder(folderName, { parentId: parentFolderId });

    if (folderResult.success && folderResult.data?.id) {
      const updatedLead = await prisma.lead.update({
        where: { id: leadId },
        data: { googleDriveFolderId: folderResult.data.id },
      });
      console.log(`[Server Action] ensureLeadDriveFolderServerAction: Drive folder created and linked for lead ${leadId}: ${folderResult.data.id}`);
      revalidatePath(`/leads/${leadId}`); // Revalidate the lead page to show the link if it appears immediately
      return { success: true, folderId: updatedLead.googleDriveFolderId };
    } else {
      console.error(`[Server Action] ensureLeadDriveFolderServerAction: Failed to create Drive folder for lead ${leadId}. Message: ${folderResult.message}`);
      return { success: false, message: folderResult.message || "Failed to create Google Drive folder." };
    }
  } catch (error: any) {
    console.error(`[Server Action] ensureLeadDriveFolderServerAction: Error for lead ${leadId}:`, error);
    return { success: false, message: error.message || "An unexpected error occurred." };
  }
} 