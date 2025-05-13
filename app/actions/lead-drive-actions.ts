"use server";

import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GoogleDriveService } from "@/lib/services/googleDrive";
import { revalidatePath } from "next/cache";

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