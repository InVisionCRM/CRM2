"use client"

import { useState } from "react"
import type { LeadFile } from "@/types/documents"

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export function useUploadFile(leadId: string) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState<UploadProgress | null>(null)

  const uploadFile = async (
    file: File,
    category: string,
  ): Promise<{ success: boolean; file?: LeadFile; error?: string }> => {
    if (!leadId) {
      return { success: false, error: "Lead ID is required" }
    }

    setIsUploading(true)
    setError(null)
    setProgress({ loaded: 0, total: file.size, percentage: 0 })

    try {
      // First, get a signed URL for the upload
      const signedUrlResponse = await fetch(`/api/leads/${leadId}/files/signed-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          category,
        }),
      })

      if (!signedUrlResponse.ok) {
        const errorData = await signedUrlResponse.json()
        throw new Error(errorData.message || "Failed to get signed URL")
      }

      const { signedUrl, fileId } = await signedUrlResponse.json()

      // Upload the file to the signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file")
      }

      // Confirm the upload with the server
      const confirmResponse = await fetch(`/api/leads/${leadId}/files/${fileId}/confirm`, {
        method: "POST",
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json()
        throw new Error(errorData.message || "Failed to confirm file upload")
      }

      const fileData = await confirmResponse.json()
      return { success: true, file: fileData }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      return {
        success: false,
        error: err instanceof Error ? err.message : "An unknown error occurred",
      }
    } finally {
      setIsUploading(false)
      setProgress(null)
    }
  }

  return {
    uploadFile,
    isUploading,
    error,
    progress,
  }
}
