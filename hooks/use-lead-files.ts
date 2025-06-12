"use client"

import { useState, useEffect, useCallback } from "react"
import type { LeadFile } from "@/types/documents"
import { useFileUpload } from "./use-file-upload"

// Updated interface to match shared drive API response
interface SharedDriveFile {
  id: string
  name: string
  mimeType?: string
  size?: number
  createdTime?: string
  modifiedTime?: string
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
  iconLink?: string
  source: 'shared-drive'
  fileType: 'photo' | 'file'
}

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
      // Use new shared drive API
      const response = await fetch(`/api/files/list-shared-drive?leadId=${encodeURIComponent(leadId)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch files")
      }

      const data = await response.json()
      
      // Transform shared drive files to match LeadFile interface
      const transformedFiles: LeadFile[] = (data.files || []).map((file: SharedDriveFile) => ({
        id: file.id, // Use Google Drive file ID
        name: file.name,
        url: file.webViewLink || '',
        type: file.mimeType || 'application/octet-stream',
        size: file.size || 0,
        category: file.fileType === 'photo' ? 'photos' : 'documents',
        uploadedAt: file.modifiedTime || file.createdTime || new Date().toISOString(),
        // Additional properties for shared drive files
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        iconLink: file.iconLink,
        driveFileId: file.id,
        source: 'shared-drive' as const
      }))

      setFiles(transformedFiles)
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
      // Use new shared drive delete API
      const response = await fetch(`/api/files/delete-from-shared-drive?driveFileId=${encodeURIComponent(fileId)}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete file")
      }

      // Remove file from local state
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId))
      return { success: true }
    } catch (err) {
      console.error("Error deleting file:", err)
      return {
        success: false,
        error: err instanceof Error ? err.message : "An unknown error occurred",
      }
    }
  }

  const uploadFile = async (originalFile: File, desiredName: string, fileType: 'file' | 'photo' = 'file') => {
    let fileToUpload = originalFile;
    if (desiredName && originalFile.name !== desiredName) {
      fileToUpload = new File([originalFile], desiredName, { type: originalFile.type });
    }

    try {
      // Use new shared drive upload API
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('leadId', leadId)
      formData.append('fileType', fileType)

      const response = await fetch('/api/files/upload-to-shared-drive', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload file")
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh files to show the new upload
        await fetchFiles()
        return { success: true, message: "File uploaded successfully" }
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (err) {
      console.error("Error in useLeadFiles during upload:", err)
      return {
        success: false,
        message: err instanceof Error ? err.message : "Upload failed in useLeadFiles",
      }
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
