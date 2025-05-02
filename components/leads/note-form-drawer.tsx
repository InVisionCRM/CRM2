"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer"
import { X, Trash2 } from "lucide-react"
import TakePhotoButton from "@/components/photos/take-photo-button"
import type { PhotoStage } from "@/types/photo"

interface NoteFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string, images: Array<{ url: string; name: string; stage: PhotoStage }>) => Promise<void>
  isSubmitting: boolean
}

export function NoteFormDrawer({ isOpen, onClose, onSubmit, isSubmitting }: NoteFormDrawerProps) {
  const [content, setContent] = useState("")
  const [images, setImages] = useState<Array<{ url: string; name: string; stage: PhotoStage }>>([])

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return

    try {
      await onSubmit(content, images)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error submitting note:", error)
    }
  }

  const resetForm = () => {
    setContent("")
    setImages([])
  }

  const handlePhotoSaved = (photoData: { dataUrl: string; name: string; stage: PhotoStage }) => {
    // Make sure we're using the dataUrl property from photoData
    setImages((prev) => [
      ...prev,
      {
        url: photoData.dataUrl, // Use dataUrl as the url
        name: photoData.name,
        stage: photoData.stage,
      },
    ])
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-medium">Add Note</h3>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />

            {images.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Attached Photos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.name || `Photo ${index + 1}`}
                        className="w-full h-32 object-contain bg-gray-100"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                        {image.name || `Photo ${index + 1}`}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <TakePhotoButton leadId={""} onPhotoSaved={handlePhotoSaved} />
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && images.length === 0)}
                className="bg-[#a4c639] hover:bg-[#8aaa2a] text-black"
              >
                {isSubmitting ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
