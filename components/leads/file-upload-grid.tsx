"use client"

import { useState } from "react"
import { FileUploadCard } from "./file-upload-card"
import { useLeadFiles } from "@/hooks/use-lead-files"
import { useUploadFile } from "@/hooks/use-upload-file"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { documentCategories } from "@/lib/document-categories"
import type { DocumentCategory } from "@/types/documents"

interface FileUploadGridProps {
  leadId: string
}

export function FileUploadGrid({ leadId }: FileUploadGridProps) {
  const { files, isLoading, error, refreshFiles, deleteFile } = useLeadFiles(leadId)
  const { uploadFile, isUploading } = useUploadFile(leadId)
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState<DocumentCategory>("all")

  const handleUpload = async (file: File, category: string) => {
    const result = await uploadFile(file, category)

    if (result.success) {
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      })
      refreshFiles()
    } else {
      toast({
        title: "Upload failed",
        description: result.error || "An error occurred while uploading the file.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    const result = await deleteFile(fileId)

    if (result.success) {
      toast({
        title: "File deleted",
        description: `${fileName} has been deleted.`,
      })
    } else {
      toast({
        title: "Delete failed",
        description: result.error || "An error occurred while deleting the file.",
        variant: "destructive",
      })
    }
  }

  const filteredFiles = activeCategory === "all" ? files : files.filter((file) => file.category === activeCategory)

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error loading files: {error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={(value) => setActiveCategory(value as DocumentCategory)}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          {documentCategories.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-md animate-pulse"></div>)
            ) : filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <FileUploadCard key={file.id} file={file} onDelete={() => handleDelete(file.id, file.name)} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <p>No files uploaded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {documentCategories.map((category) => (
          <TabsContent key={category.value} value={category.value} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array(2)
                  .fill(0)
                  .map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-md animate-pulse"></div>)
              ) : filteredFiles.length > 0 ? (
                filteredFiles.map((file) => (
                  <FileUploadCard key={file.id} file={file} onDelete={() => handleDelete(file.id, file.name)} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <p>No {category.label.toLowerCase()} files uploaded yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
