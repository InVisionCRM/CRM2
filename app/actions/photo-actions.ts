"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { uploadPhotoToBlob, deletePhotoFromBlob } from "@/lib/services/photos"

// Types
interface PhotoMetadata {
  name: string
  description?: string
  thumbnailUrl: string
  fullUrl: string
  mimeType: string
  size: number
}

interface SerializedFile {
  name: string
  type: string
  size: number
  base64Data: string
}

interface LeadMetadata {
  photosFolderId?: string
  [key: string]: any
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
 * Uploads photos using Vercel Blob storage
 */
export async function uploadPhotos(
  leadId: string, 
  files: SerializedFile[], 
  description?: string
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const uploadedPhotos = []
    
    for (const file of files) {
      try {
        // Convert base64 back to File object
        let base64Data = file.base64Data
        // Remove data URL prefix if present
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1]
        }
        
        if (!base64Data) {
          throw new Error('Invalid base64 data')
        }

        const buffer = Buffer.from(base64Data, 'base64')
        const fileObj = new File(
          [buffer],
          file.name,
          { type: file.type }
        )
        
        // Upload to Vercel Blob
        const uploadResult = await uploadPhotoToBlob(fileObj, leadId)
        
        // Store the photo metadata in the database
        const photo = await prisma.leadPhoto.create({
          data: {
            leadId,
            name: file.name,
            description: description || null,
            url: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            mimeType: file.type,
            size: file.size,
            uploadedById: session.user.id,
            driveFileId: null // This is now optional in the schema
          }
        })

        uploadedPhotos.push(photo)
      } catch (error) {
        console.error(`Error uploading photo ${file.name}:`, error)
        // Continue with next file instead of failing the entire batch
      }
    }

    if (uploadedPhotos.length === 0) {
      return { 
        success: false, 
        error: "Failed to upload any photos" 
      }
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
 * Uploads a single photo using Vercel Blob storage
 */
export async function uploadSinglePhoto(
  leadId: string, 
  file: SerializedFile, 
  description?: string
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Convert base64 back to a Buffer
    let base64Data = file.base64Data
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1]
    }
    
    if (!base64Data) {
      throw new Error('Invalid base64 data')
    }

    const buffer = Buffer.from(base64Data, 'base64')
    const fileObj = new File([buffer], file.name, { type: file.type })
    
    // Upload to Vercel Blob
    const uploadResult = await uploadPhotoToBlob(fileObj, leadId)
    
    // Store the photo metadata in the database
    const photo = await prisma.leadPhoto.create({
      data: {
        leadId,
        name: file.name,
        description: description || null,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        mimeType: file.type,
        size: file.size,
        uploadedById: session.user.id,
        driveFileId: null
      }
    })

    revalidatePath(`/leads/${leadId}`)
    
    return { success: true, photo }
  } catch (error) {
    console.error(`Error uploading photo ${file.name}:`, error)
    return { 
      success: false, 
      error: `Failed to upload ${file.name}` 
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
 * Deletes a photo
 */
export async function deletePhoto(photoId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the photo to check if it exists
    const photo = await prisma.leadPhoto.findUnique({
      where: { id: photoId },
      select: { leadId: true, url: true }
    })

    if (!photo) {
      return { 
        success: false, 
        error: "Photo not found" 
      }
    }

    // Delete from Vercel Blob
    await deletePhotoFromBlob(photo.url)
    
    // Delete from database
    await prisma.leadPhoto.delete({
      where: { id: photoId }
    })

    revalidatePath(`/leads/${photo.leadId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Error deleting photo:", error)
    return { 
      success: false, 
      error: "Failed to delete photo" 
    }
  }
}

export async function updatePhoto(
  photoId: string, 
  updates: { 
    url?: string; 
    description?: string | null;
    imageData?: string; // Base64 image data for edited photos
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    // First get the existing photo to get the leadId
    const existingPhoto = await prisma.leadPhoto.findUnique({
      where: { id: photoId },
      select: { leadId: true, url: true, thumbnailUrl: true }
    })

    if (!existingPhoto) {
      return { success: false, error: "Photo not found" }
    }

    // If there's new image data, upload it to Vercel Blob
    let newUrl: string | undefined
    let newThumbnailUrl: string | undefined

    if (updates.imageData) {
      try {
        // Handle base64 data
        let base64Data = updates.imageData
        // Remove data URL prefix if present
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1]
        }
        
        if (!base64Data) {
          throw new Error('Invalid base64 data')
        }

        const buffer = Buffer.from(base64Data, 'base64')
        const fileObj = new File(
          [buffer],
          'edited-photo.jpg',
          { type: 'image/jpeg' }
        )

        // Delete the old image from Vercel Blob
        if (existingPhoto.url) {
          await deletePhotoFromBlob(existingPhoto.url)
        }
        if (existingPhoto.thumbnailUrl && existingPhoto.thumbnailUrl !== existingPhoto.url) {
          await deletePhotoFromBlob(existingPhoto.thumbnailUrl)
        }

        // Upload the new image
        const uploadResult = await uploadPhotoToBlob(fileObj, existingPhoto.leadId)
        
        // Update the URLs
        newUrl = uploadResult.url
        newThumbnailUrl = uploadResult.thumbnailUrl
      } catch (error) {
        console.error('Error processing image data:', error)
        return { success: false, error: 'Failed to process image data' }
      }
    }

    // Remove imageData from updates before saving to database
    const { imageData, ...otherUpdates } = updates

    // Update the photo with new URLs if they exist
    const photo = await prisma.leadPhoto.update({
      where: { id: photoId },
      data: {
        ...otherUpdates,
        ...(newUrl ? { url: newUrl } : {}),
        ...(newThumbnailUrl ? { thumbnailUrl: newThumbnailUrl } : {})
      },
    })

    revalidatePath(`/leads/${existingPhoto.leadId}`)
    return { success: true, photo }
  } catch (error) {
    console.error("Error updating photo:", error)
    return { success: false, error: "Failed to update photo" }
  }
} 