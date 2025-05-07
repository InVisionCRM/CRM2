"use client"

import { useState, useEffect, useCallback } from "react"
import type { LeadFile } from "@/types/documents"
import { deleteFileAction } from "@/app/actions/file-actions"
import { useFileUpload } from "./use-file-upload"

export function useLeadFiles(leadId: string) {
  const [files, setFiles] = useState<LeadFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { uploadFile: performUpload, isUploading: isCurrentlyUploading, error: uploadError } = useFileUpload()

  const fetchFiles = useCallback(async () => {
    if (!leadId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/leads/${leadId}/files`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch files")
      }

      const data = await response.json()
      setFiles(data)
    } catch (err) {
      console.error("Error fetching files:", err)
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    if (leadId) {
      fetchFiles()
    }
  }, [leadId, fetchFiles])

  const deleteFile = async (fileId: string) => {
    try {
      const result = await deleteFileAction(fileId)
      if (result.success) {
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId))
        return { success: true }
      } else {
        throw new Error(result.message || "Failed to delete file")
      }
    } catch (err) {
      console.error("Error deleting file:", err)
      return {
        success: false,
        error: err instanceof Error ? err.message : "An unknown error occurred",
      }
    }
  }

  const uploadFile = async (originalFile: File, desiredName: string) => {
    let fileToUpload = originalFile;
    if (desiredName && originalFile.name !== desiredName) {
      fileToUpload = new File([originalFile], desiredName, { type: originalFile.type });
    }

    try {
      const result = await performUpload(fileToUpload, leadId, undefined);
      if (result.success) {
        await fetchFiles();
      }
      return result;
    } catch (err) {
      console.error("Error in useLeadFiles during upload:", err);
      return {
        success: false,
        message: err instanceof Error ? err.message : "Upload failed in useLeadFiles",
      };
    }
  }

  return {
    files,
    isLoading,
    error,
    refreshFiles: fetchFiles,
    deleteFile,
    uploadFile,
    isUploading: isCurrentlyUploading,
    uploadError,
  }
}
