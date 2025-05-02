"use server"

import { revalidatePath } from "next/cache"
import { createFile, deleteFile } from "@/lib/db/files"
import { uploadToBlob, deleteFromBlob } from "@/lib/blob"

export async function uploadFileAction(leadId: string, file: File, category?: string) {
  try {
    console.log(`Uploading file for lead ${leadId}:`, file.name)

    // Upload file to Vercel Blob
    const uploadedFile = await uploadToBlob(file, leadId)
    console.log("File uploaded to blob:", uploadedFile)

    // Create file record in database
    await createFile({
      lead_id: leadId,
      url: uploadedFile.url,
      filename: uploadedFile.filename,
      filesize: uploadedFile.filesize,
      category: category
    })

    revalidatePath(`/leads/${leadId}`)

    return {
      success: true,
      message: "File uploaded successfully",
    }
  } catch (error) {
    console.error("Error uploading file:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload file",
    }
  }
}

export async function deleteFileAction(fileId: string) {
  try {
    console.log(`Deleting file with ID: ${fileId}`)

    // Get the file details before deletion to get the URL and lead ID
    const file = await deleteFile(fileId)

    if (!file) {
      return {
        success: false,
        message: "File not found",
      }
    }

    // Try to delete the file from Vercel Blob storage
    try {
      await deleteFromBlob(file.url)
      console.log("File deleted from blob storage")
    } catch (blobError) {
      // Log but continue even if blob deletion fails
      console.warn("Could not delete file from blob storage:", blobError)
    }

    // Revalidate the lead page to refresh the UI
    revalidatePath(`/leads/${file.lead_id}`)

    return {
      success: true,
      message: "File deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete file",
    }
  }
}
