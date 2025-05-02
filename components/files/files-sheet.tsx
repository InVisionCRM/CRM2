"use client"

import type React from "react"
import { useRef } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DocumentCategoryType, LeadFile } from "@/types/documents"
import type { Lead } from "@/types/lead"
import { documentCategories } from "@/lib/document-categories"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useToast } from "@/hooks/use-toast"

interface FilesSheetProps {
  isOpen: boolean
  onClose: () => void
  files: LeadFile[]
  leadId: string
  selectedLead?: Lead
  onFileUploaded?: () => void
}

export function FilesSheet({ isOpen, onClose, files, leadId, selectedLead, onFileUploaded }: FilesSheetProps) {
  const { uploadFile, isUploading } = useFileUpload()
  const { toast } = useToast()

  // Count files for each category
  const getFileCountForCategory = (categoryId: string): number => {
    return files.filter(file => file.category === categoryId).length
  }

  // Add file counts to categories
  const categoriesWithCounts = documentCategories.map((category) => ({
    ...category,
    fileCount: getFileCountForCategory(category.id),
  }))

  // Use the selected lead ID if provided, otherwise use the passed leadId
  const effectiveLeadId = selectedLead?.id || leadId

  const handleFileUpload = async (files: FileList, category: DocumentCategoryType) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const result = await uploadFile(file, effectiveLeadId, category.id)
      
      if (result.success) {
        toast({
          title: "File uploaded",
          description: `${file.name} has been uploaded successfully.`,
        })
      } else {
        toast({
          title: "Upload failed",
          description: result.message || "Failed to upload file",
          variant: "destructive",
        })
      }
      
      return result
    })

    const results = await Promise.all(uploadPromises)
    
    if (results.some(r => r.success) && onFileUploaded) {
      onFileUploaded()
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[50vh]">
        <DrawerHeader className="border-b border-gray-200 dark:border-gray-800 px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-base font-semibold">Files & Documents</DrawerTitle>
              {selectedLead && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  For: {selectedLead.firstName} {selectedLead.lastName}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DrawerHeader>

        <Tabs defaultValue="grid" className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-800 px-4">
            <TabsList className="h-8">
              <TabsTrigger value="grid" className="text-xs data-[state=active]:bg-background">Grid View</TabsTrigger>
              <TabsTrigger value="list" className="text-xs data-[state=active]:bg-background">List View</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-2">
            <TabsContent value="grid" className="mt-0">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {categoriesWithCounts.map((category) => (
                  <FileCategoryCard
                    key={category.id}
                    category={category}
                    onUpload={(files) => handleFileUpload(files, category)}
                    leadId={effectiveLeadId}
                    disabled={isUploading}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <div className="space-y-2">
                {categoriesWithCounts.map((category) => {
                  const categoryFiles = files.filter(file => file.category === category.id)
                  if (categoryFiles.length === 0) return null

                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <category.icon className={cn("h-3 w-3", category.color)} />
                        <h3 className="text-xs font-medium">{category.name}</h3>
                        <span className="text-[10px] text-muted-foreground">({categoryFiles.length})</span>
                      </div>
                      <div className="grid gap-1">
                        {categoryFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between rounded-lg border p-1.5 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(file.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => window.open(file.url, "_blank")}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}

interface FileCategoryCardProps {
  category: DocumentCategoryType & { fileCount?: number }
  onUpload: (files: FileList) => void
  leadId: string
  disabled?: boolean
}

function FileCategoryCard({ category, onUpload, leadId, disabled }: FileCategoryCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files)
      // Clear the input so the same file can be uploaded again if needed
      e.target.value = ""
    }
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:scale-[1.02] rounded-lg",
        "cursor-pointer aspect-square",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      style={{ maxWidth: "80px", maxHeight: "80px" }}
      onClick={handleClick}
      data-disabled={disabled}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        multiple
        data-lead-id={leadId}
        aria-label={`Upload ${category.name} files`}
        disabled={disabled}
      />

      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center p-2 text-center",
          category.bgColor,
          "transition-all duration-200 group-hover:bg-opacity-90",
        )}
      >
        <category.icon className={cn("h-4 w-4 mb-1", category.color)} />
        <p className={cn("font-medium text-[10px] leading-tight", category.color)}>{category.name}</p>

        {category.fileCount && category.fileCount > 0 && (
          <div className="mt-1">
            <span className={cn("text-[8px] px-1 py-0.5 rounded-full", category.bgColor, "bg-opacity-50")}>
              {category.fileCount}
            </span>
          </div>
        )}

        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 transition-opacity duration-200",
          "group-hover:opacity-100",
        )}>
          <p className="text-[8px] font-medium text-muted-foreground bg-background/90 px-1.5 py-0.5 rounded">
            Upload
          </p>
        </div>
      </div>
    </div>
  )
}
