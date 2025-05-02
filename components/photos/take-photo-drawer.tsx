"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerClose, DrawerHeader } from "@/components/ui/drawer"
import { Camera, RefreshCw, Save, X, FlipHorizontal, Pencil, Edit } from "lucide-react"
import PhotoCanvas from "./photo-canvas"
import { PhotoStage, type PhotoData, type CameraFacing } from "@/types/photo"

interface TakePhotoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSavePhoto: (photoData: PhotoData) => void
  leadId?: string
}

export default function TakePhotoDrawer({ open, onOpenChange, onSavePhoto, leadId }: TakePhotoDrawerProps) {
  const [photoTaken, setPhotoTaken] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("")
  const [photoName, setPhotoName] = useState<string>("")
  const [photoStage, setPhotoStage] = useState<PhotoStage>(PhotoStage.Before)
  const [annotations, setAnnotations] = useState<string>("")
  const [isDrawing, setIsDrawing] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>("environment") // Default to rear camera
  const [isEditingName, setIsEditingName] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Initialize camera when drawer opens
  useEffect(() => {
    if (open && !photoTaken) {
      initializeCamera()
    }

    // Cleanup function to stop camera when drawer closes
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [open, photoTaken, cameraFacing])

  // Set default photo name based on current date/time
  useEffect(() => {
    if (photoTaken && !photoName) {
      const now = new Date()
      setPhotoName(`Photo ${now.toISOString().slice(0, 16).replace("T", " ")}`)
    }
  }, [photoTaken, photoName])

  // Focus input when editing name
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isEditingName])

  const initializeCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Unable to access camera. Please make sure you've granted camera permissions.")
    }
  }

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"))
  }

  const takePhoto = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/jpeg")

    setPhotoDataUrl(dataUrl)
    setPhotoTaken(true)

    // Stop the camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const retakePhoto = () => {
    setPhotoTaken(false)
    setPhotoDataUrl("")
    setAnnotations("")
    setIsDrawing(false)
    setIsEditingName(false)
  }

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing)
  }

  const handleSaveAnnotations = (annotationsData: string) => {
    // Save the annotated image data
    setPhotoDataUrl(annotationsData)
    setAnnotations(annotationsData)

    // Close the drawing mode
    setIsDrawing(false)
  }

  const savePhoto = () => {
    if (!photoDataUrl) return

    // Create the photo data object with all properties
    const photoData: PhotoData = {
      name: photoName || `Photo ${new Date().toISOString()}`,
      dataUrl: photoDataUrl,
      stage: photoStage, // Make sure we're including the selected stage
      annotations: annotations,
      createdAt: new Date(),
      leadId: leadId,
    }

    console.log("Saving photo with stage:", photoStage)

    // Pass the complete photo data to the parent component
    onSavePhoto(photoData)
    onOpenChange(false)

    // Reset state
    setPhotoTaken(false)
    setPhotoDataUrl("")
    setPhotoName("")
    setAnnotations("")
    setIsDrawing(false)
    setIsEditingName(false)
  }

  const toggleNameEdit = () => {
    setIsEditingName(!isEditingName)
  }

  const handleNameBlur = () => {
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditingName(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[99vh] max-h-[99vh]">
        {/* Empty DrawerHeader to satisfy the import but not take up space */}
        <DrawerHeader />

        <div className="flex-1 overflow-y-auto">
          {!photoTaken ? (
            // Camera view - reduced by 25%
            <div className="p-4 space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video w-[75%] mx-auto">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                {/* Camera flip button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 text-white"
                  onClick={toggleCameraFacing}
                >
                  <FlipHorizontal className="h-5 w-5" />
                </Button>

                {/* Circular camera shutter button */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    onClick={takePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-[#a4c639] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                    aria-label="Take photo"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#a4c639] flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Photo review - with iOS-inspired interface and reduced image size
            <div>
              {/* Photo container - reduced by 25% */}
              <div className="relative bg-black overflow-hidden w-[75%] mx-auto">
                {isDrawing ? (
                  // Drawing mode
                  <div className="relative">
                    <PhotoCanvas
                      imageUrl={photoDataUrl}
                      onSave={handleSaveAnnotations}
                      initialAnnotations={annotations}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 left-2 bg-white/80"
                      onClick={toggleDrawing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  // Photo view
                  <div className="relative">
                    <img src={photoDataUrl || "/placeholder.svg"} alt="Captured" className="w-full h-auto" />
                  </div>
                )}
              </div>

              {/* iOS-style controls section */}
              <div className="p-4 space-y-4">
                {/* Inline name editing */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {isEditingName ? (
                      <Input
                        ref={nameInputRef}
                        value={photoName}
                        onChange={(e) => setPhotoName(e.target.value)}
                        onBlur={handleNameBlur}
                        onKeyDown={handleNameKeyDown}
                        className="h-9"
                      />
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium mr-1">Name:</span>
                        <span className="text-sm truncate">{photoName}</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleNameEdit}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit name</span>
                  </Button>
                </div>

                {/* Segmented control for stage */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Stage</Label>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-muted">
                    <Button
                      variant={photoStage === PhotoStage.Before ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 ${
                        photoStage === PhotoStage.Before
                          ? "bg-[#a4c639] hover:bg-[#8aaa2a] text-black"
                          : "hover:bg-muted-foreground/10"
                      }`}
                      onClick={() => setPhotoStage(PhotoStage.Before)}
                    >
                      Before
                    </Button>
                    <Button
                      variant={photoStage === PhotoStage.During ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 ${
                        photoStage === PhotoStage.During
                          ? "bg-[#a4c639] hover:bg-[#8aaa2a] text-black"
                          : "hover:bg-muted-foreground/10"
                      }`}
                      onClick={() => setPhotoStage(PhotoStage.During)}
                    >
                      During
                    </Button>
                    <Button
                      variant={photoStage === PhotoStage.After ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 ${
                        photoStage === PhotoStage.After
                          ? "bg-[#a4c639] hover:bg-[#8aaa2a] text-black"
                          : "hover:bg-muted-foreground/10"
                      }`}
                      onClick={() => setPhotoStage(PhotoStage.After)}
                    >
                      After
                    </Button>
                  </div>
                </div>

                {/* Action buttons as icons with text */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-auto py-2"
                    onClick={toggleDrawing}
                  >
                    <Pencil className="h-5 w-5 mb-1" />
                    <span className="text-xs">Annotate</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-auto py-2"
                    onClick={retakePhoto}
                  >
                    <RefreshCw className="h-5 w-5 mb-1" />
                    <span className="text-xs">Retake</span>
                  </Button>
                  <Button
                    className="flex flex-col items-center justify-center h-auto py-2 bg-[#a4c639] hover:bg-[#8aaa2a] text-black"
                    onClick={savePhoto}
                  >
                    <Save className="h-5 w-5 mb-1" />
                    <span className="text-xs">Save</span>
                  </Button>
                </div>

                {/* Cancel button */}
                <div className="pt-2">
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </DrawerClose>
                </div>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
