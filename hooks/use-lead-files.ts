"use client"

import { useState, useEffect } from "react"
import type { LeadFile } from "@/types/documents"

export function useLeadFiles(leadId: string) {
  const [files, setFiles] = useState<LeadFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchFiles = async () => {
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
  }

  useEffect(() => {
    if (leadId) {
      fetchFiles()
    }
  }, [leadId])

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/files/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete file")
      }

      // Remove the deleted file from the state
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

  return {
    files,
    isLoading,
    error,
    refreshFiles: fetchFiles,
    deleteFile,
  }
}
