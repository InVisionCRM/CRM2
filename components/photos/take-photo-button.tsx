"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import TakePhotoDrawer from "./take-photo-drawer"
import type { PhotoData } from "@/types/photo"
import type { PhotoStage } from "@/types/photo"

interface TakePhotoButtonProps {
  leadId?: string
  onPhotoSaved: (photoData: { dataUrl: string; name: string; stage: PhotoStage }) => void
}

export default function TakePhotoButton({ leadId, onPhotoSaved }: TakePhotoButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSavePhoto = (photoData: PhotoData) => {
    // Pass the correct properties to the callback
    onPhotoSaved({
      dataUrl: photoData.dataUrl,
      name: photoData.name,
      stage: photoData.stage,
    })
    setIsOpen(false)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <Camera className="h-4 w-4" />
        <span>Take Photo</span>
      </Button>

      <TakePhotoDrawer open={isOpen} onOpenChange={setIsOpen} onSavePhoto={handleSavePhoto} leadId={leadId} />
    </>
  )
}
