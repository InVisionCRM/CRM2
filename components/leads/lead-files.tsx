"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLeadFiles } from "@/hooks/use-lead-files"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"
import { FilesSheet } from "@/components/files/files-sheet"

interface LeadFilesProps {
  leadId: string
}

export function LeadFiles({ leadId }: LeadFilesProps) {
  const { files, isLoading, error, refreshFiles } = useLeadFiles(leadId)
  const { toast } = useToast()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-6">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-6 text-red-500">
          <p>Error loading files</p>
          <p className="text-sm">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        </div>
      )
    }

    if (!files || files.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>No files uploaded yet</p>
          <p className="text-sm">Upload files to keep track of documents for this lead</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div key={file.id} className="text-sm">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-muted-foreground text-xs">{new Date(file.uploadedAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Files & Documents</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsSheetOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>

      <FilesSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        files={files || []}
        leadId={leadId}
        onFileUploaded={refreshFiles}
      />
    </Card>
  )
}
