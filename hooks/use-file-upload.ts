import { useState } from "react"
import { uploadFileAction } from "@/app/actions/file-actions"

interface UseFileUploadReturn {
  uploadFile: (file: File, leadId: string, category: string) => Promise<{
    success: boolean
    message?: string
  }>
  isUploading: boolean
  error: Error | null
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const uploadFile = async (file: File, leadId: string, category: string) => {
    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadFileAction(leadId, file, category)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to upload file")
      setError(error)
      return {
        success: false,
        message: error.message,
      }
    } finally {
      setIsUploading(false)
    }
  }

  return {
    uploadFile,
    isUploading,
    error,
  }
} 