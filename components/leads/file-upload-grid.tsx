"use client"

import { useState } from "react"
// import { FileUploadCard } from "./file-upload-card"
import { useLeadFiles } from "@/hooks/use-lead-files"
import { useUploadFile } from "@/hooks/use-upload-file"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LeadFile, DocumentCategoryType } from "@/types/documents"
import { documentCategories } from "@/lib/document-categories"
import { Button } from "@/components/ui/button"

interface FileUploadGridProps {
  leadId: string
}

export function FileUploadGrid({ leadId }: FileUploadGridProps) {
  const { files, isLoading, error, refreshFiles, deleteFile } = useLeadFiles(leadId)
  const { uploadFile, isUploading } = useUploadFile(leadId)
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState<string>("all")

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
      <Tabs defaultValue="all" onValueChange={(value) => setActiveCategory(value)}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-2">
          <TabsTrigger value="all">All</TabsTrigger>
          {documentCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
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
                // <FileUploadCard key={file.id} file={file} onDelete={() => handleDelete(file.id, file.name)} />
                <div key={file.id} className="border rounded-lg p-3 space-y-2">
                  <p className="font-medium truncate">{file.name} (Upload Card Placeholder)</p>
                  <p className="text-xs text-muted-foreground">Type: {file.category}, Size: {file.size}</p>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(file.id, file.name)}>Delete</Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <p>No files uploaded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <ScrollArea className="h-[400px] mt-4">
          {documentCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFiles
                  .filter((file) => file.category === category.id)
                  .map((file) => (
                    <div key={file.id} className="border rounded-lg p-3 space-y-2">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">Preview of FileUploadCard</p>
                    </div>
                  ))}
                {filteredFiles.filter((file) => file.category === category.id).length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p>No {category.name.toLowerCase()} files uploaded yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  )
}
