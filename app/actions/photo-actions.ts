"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { GoogleDriveService } from "@/lib/services/googleDrive"

// Types
interface PhotoMetadata {
  name: string
  description?: string
  driveFileId: string
  thumbnailUrl: string
  fullUrl: string
  mimeType: string
  size: number
}

/**
 * Helper function to ensure the lead has a metadata field initialized
 */
async function ensureLeadMetadata(leadId: string): Promise<boolean> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { metadata: true }
    });

    if (!lead) return false;

    // If metadata is null, initialize it with an empty object
    if (lead.metadata === null) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { metadata: {} }
      });
    }

    return true;
  } catch (error) {
    console.error("Error ensuring lead metadata:", error);
    return false;
  }
}

/**
 * Creates a Photos folder in the lead's Google Drive
 */
export async function createPhotosFolder(leadId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.accessToken) {
      return { success: false, error: "Unauthorized" }
    }

    // Initialize metadata field if needed
    const metadataInitialized = await ensureLeadMetadata(leadId);
    if (!metadataInitialized) {
      return { success: false, error: "Lead not found or metadata initialization failed" };
    }

    // Get the lead to check if it has a Google Drive folder ID
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { 
        googleDriveFolderId: true,
        metadata: true
      }
    })

    if (!lead?.googleDriveFolderId) {
      return { 
        success: false, 
        error: "This lead doesn't have a Google Drive folder set up" 
      }
    }

    // Initialize Google Drive service with access token
    const driveService = new GoogleDriveService({ 
      accessToken: session.accessToken 
    })

    // Create a "Photos" folder inside the lead's folder
    const folderResult = await driveService.createFolder(
      "Photos", 
      { parentId: lead.googleDriveFolderId }
    )

    if (!folderResult.success || !folderResult.data) {
      return { 
        success: false, 
        error: folderResult.message || "Failed to create Photos folder in Google Drive" 
      }
    }

    // Store the Photos folder ID in the lead's metadata
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        metadata: {
          ...(lead.metadata as Record<string, any> || {}),
          photosFolderId: folderResult.data.id
        }
      }
    })

    revalidatePath(`/leads/${leadId}`)
    
    return { 
      success: true, 
      folderId: folderResult.data.id
    }
  } catch (error) {
    console.error("Error creating photos folder:", error)
    return { 
      success: false, 
      error: "Failed to create photos folder" 
    }
  }
}

/**
 * Checks if a Photos folder exists for the lead
 */
export async function checkPhotosFolder(leadId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the lead to check if it has a Photos folder ID in metadata
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { 
        googleDriveFolderId: true,
        metadata: true
      }
    })

    if (!lead?.googleDriveFolderId) {
      return { 
        success: false, 
        error: "This lead doesn't have a Google Drive folder set up",
        hasFolder: false
      }
    }

    // Check if the Photos folder ID exists in metadata
    const photosFolderId = lead.metadata?.photosFolderId

    return { 
      success: true, 
      hasFolder: !!photosFolderId,
      folderId: photosFolderId
    }
  } catch (error) {
    console.error("Error checking photos folder:", error)
    return { 
      success: false, 
      error: "Failed to check if photos folder exists",
      hasFolder: false
    }
  }
}

/**
 * Uploads photos to the lead's Photos folder in Google Drive
 */
export async function uploadPhotos(
  leadId: string, 
  files: {
    name: string;
    type: string;
    size: number;
    arrayBuffer: ArrayBuffer;
  }[], 
  description?: string
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.accessToken) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if the Photos folder exists
    const folderCheck = await checkPhotosFolder(leadId)
    
    if (!folderCheck.success || !folderCheck.hasFolder) {
      return { 
        success: false, 
        error: folderCheck.error || "Photos folder not found" 
      }
    }

    // Initialize Google Drive service
    const driveService = new GoogleDriveService({ accessToken: session.accessToken })
    
    // Upload each file to Google Drive
    const uploadedPhotos: PhotoMetadata[] = []
    
    for (const file of files) {
      // Create a File object from the arrayBuffer and metadata
      const fileObj = new File(
        [new Uint8Array(file.arrayBuffer)],
        file.name,
        { type: file.type }
      );
      
      // Upload the file to the Photos folder in Google Drive
      const uploadResult = await driveService.uploadFile(fileObj, {
        folderId: folderCheck.folderId as string 
      })
      
      if (!uploadResult.success || !uploadResult.data) {
        console.error("Failed to upload file to Google Drive:", uploadResult.message)
        continue // Skip to next file 
      }
      
      // Use the uploaded file data
      const driveFile = uploadResult.data
      
      // Create a thumbnail URL from the Google Drive file
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveFile.id}&sz=w300`
      
      // Store the photo metadata in the database
      const photo = await prisma.leadPhoto.create({
        data: {
          leadId,
          name: file.name,
          description: description || "",
          driveFileId: driveFile.id,
          thumbnailUrl: thumbnailUrl,
          url: driveFile.webViewLink,
          mimeType: file.type,
          size: file.size,
          uploadedById: session.user.id
        }
      })

      uploadedPhotos.push({
        name: photo.name,
        description: photo.description || undefined,
        driveFileId: photo.driveFileId,
        thumbnailUrl: photo.thumbnailUrl,
        fullUrl: photo.url,
        mimeType: photo.mimeType || "",
        size: photo.size || 0
      })
    }

    revalidatePath(`/leads/${leadId}`)
    
    return { 
      success: true, 
      photos: uploadedPhotos
    }
  } catch (error) {
    console.error("Error uploading photos:", error)
    return { 
      success: false, 
      error: "Failed to upload photos" 
    }
  }
}

/**
 * Gets all photos for a lead
 */
export async function getLeadPhotos(leadId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get all photos for the lead
    const photos = await prisma.leadPhoto.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: {
            name: true,
            image: true
          }
        }
      }
    })

    return { 
      success: true, 
      photos
    }
  } catch (error) {
    console.error("Error getting lead photos:", error)
    return { 
      success: false, 
      error: "Failed to get lead photos" 
    }
  }
}

/**
 * Deletes a photo from the lead's Photos folder
 */
export async function deletePhoto(photoId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.accessToken) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the photo to check if it exists and get the lead ID
    const photo = await prisma.leadPhoto.findUnique({
      where: { id: photoId },
      select: { leadId: true, driveFileId: true }
    })

    if (!photo) {
      return { 
        success: false, 
        error: "Photo not found" 
      }
    }

    // Initialize Google Drive service
    const driveService = new GoogleDriveService({ accessToken: session.accessToken })
    
    // Delete the file from Google Drive
    const deleteResult = await driveService.deleteFile(photo.driveFileId)
    
    if (!deleteResult.success) {
      console.error("Failed to delete file from Google Drive:", deleteResult.message)
      // Continue anyway to delete the database record
    }

    // Delete the photo from the database
    await prisma.leadPhoto.delete({
      where: { id: photoId }
    })

    revalidatePath(`/leads/${photo.leadId}`)
    
    return { 
      success: true
    }
  } catch (error) {
    console.error("Error deleting photo:", error)
    return { 
      success: false, 
      error: "Failed to delete photo" 
    }
  }
} 