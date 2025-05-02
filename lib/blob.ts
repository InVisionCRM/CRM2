import { put, del } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function uploadToBlob(file: File, leadId?: string) {
  try {
    // Create a filename with optional folder structure
    let filename
    const uniqueId = nanoid()
    if (leadId) {
      // If leadId is provided, use client folder structure with the client ID
      filename = `clients/${leadId}/${uniqueId}-${file.name}`
    } else {
      // Otherwise use the default structure
      filename = `${uniqueId}-${file.name}`
    }

    const blob = await put(filename, file, {
      access: "public",
    })

    return {
      url: blob.url,
      filename: file.name,
      filesize: file.size,
    }
  } catch (error) {
    console.error("Error uploading file to Vercel Blob:", error)
    throw new Error("Failed to upload file")
  }
}

export async function deleteFromBlob(url: string): Promise<void> {
  try {
    // Delete the file from Vercel Blob
    await del(url)
  } catch (error) {
    console.error("Error deleting from blob:", error)
    throw new Error("Failed to delete file from blob storage")
  }
}
