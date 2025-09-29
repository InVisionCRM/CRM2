"use client"

import type React from "react"

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerClose, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Camera, RefreshCw, Save, X, FlipHorizontal, Pencil, Edit, Mic, Keyboard, FileText, MicOff, Tag } from "lucide-react"
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
  const [zoomLevel, setZoomLevel] = useState<number>(1) // 1x zoom by default
  const [description, setDescription] = useState<string>("")
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTagsDrawer, setShowTagsDrawer] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Available tags based on the provided images
  const availableTags = [
    "Back Side",
    "Before and After", 
    "Bottom",
    "Clock In",
    "Clock Out",
    "Document",
    "East Side",
    "Finished",
    "Front Side",
    "Left Side",
    "New",
    "North Side",
    "Old",
    "Receipt",
    "Right Side",
    "South Side",
    "Start",
    "Top",
    "West Side"
  ]

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
    
    // Auto-show description popup after taking photo
    setTimeout(() => {
      setShowDescriptionPopup(true)
    }, 500) // Small delay for smooth transition

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
    setZoomLevel(1) // Reset zoom to 1x
    setDescription("") // Reset description
    setShowDescriptionPopup(false) // Reset popup
    setIsListening(false) // Reset speech
    setSelectedTags([]) // Reset tags
    setShowTagsDrawer(false) // Reset tags drawer
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

  const savePhoto = (options?: { closeAfter?: boolean }) => {
    const closeAfter = options?.closeAfter !== false
    if (!photoDataUrl) return

    // Create the photo data object with all properties
    const photoData: PhotoData = {
      name: photoName || `Photo ${new Date().toISOString()}`,
      dataUrl: photoDataUrl,
      stage: photoStage, // Make sure we're including the selected stage
      annotations: annotations,
      description: description, // Include description from popup
      tags: selectedTags,
      createdAt: new Date(),
      leadId: leadId,
    }

    console.log("Saving photo with stage:", photoStage)

    // Pass the complete photo data to the parent component
    onSavePhoto(photoData)

    if (closeAfter) {
      onOpenChange(false)
    }

    // Reset state
    setPhotoTaken(false)
    setPhotoDataUrl("")
    setPhotoName("")
    setAnnotations("")
    setIsDrawing(false)
    setIsEditingName(false)
    setZoomLevel(1) // Reset zoom to 1x
    setDescription("") // Reset description
    setShowDescriptionPopup(false) // Reset popup
    setIsListening(false) // Reset speech
    setSelectedTags([]) // Reset tags
    setShowTagsDrawer(false) // Reset tags drawer

    // If continuing, reinitialize the camera immediately
    if (!closeAfter) {
      setTimeout(() => {
        initializeCamera()
      }, 50)
    }
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

  // Speech-to-text functionality
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: unknown) => {
      try {
        const results = (event as { results?: ArrayLike<{ 0?: { transcript?: string } }> }).results
        const first = results && (results[0] as { 0?: { transcript?: string } })
        const transcript = first?.[0]?.transcript
        if (typeof transcript === 'string') {
          setDescription(prev => prev + (prev ? ' ' : '') + transcript)
        }
      } catch (e) {
        // Swallow parsing errors silently
      }
    }

    recognition.onerror = (event: unknown) => {
      const err = (event as { error?: string }).error
      console.error('Speech recognition error:', err ?? event)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const handleDescriptionSave = () => {
    // Save and keep camera open for next shot
    savePhoto({ closeAfter: false })
  }

  const handleSkipSaveAndContinue = () => {
    // Save and reopen camera for next shot
    savePhoto({ closeAfter: false })
  }

  const handleDescriptionDrawing = () => {
    setShowDescriptionPopup(false)
    setIsDrawing(true)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleTagsOpen = () => {
    setShowTagsDrawer(true)
  }

  const handleTagsClose = () => {
    setShowTagsDrawer(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[99vh] max-h-[99vh]">
        {/* Accessible title for screen readers */}
        <DrawerHeader className="sr-only">
          <DrawerTitle>Take Photo</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {!photoTaken ? (
            // Camera view - full mobile-friendly size
            <div className="p-2 space-y-4 h-full flex flex-col">
              <div className="relative bg-black rounded-lg overflow-hidden flex-1 min-h-[60vh] max-h-[80vh]">
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
            // Photo review - with iOS-inspired interface and full mobile size
            <div className="h-full flex flex-col">
              {/* Photo container - full mobile size */}
              <div className="relative bg-black overflow-hidden flex-1 min-h-[50vh] max-h-[70vh] mx-2">
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
                    
                    {/* Floating Description Popup - compact pill */}
                    {showDescriptionPopup && (
                      <div className="fixed left-0 right-0 bottom-24 z-50 flex justify-center px-4">
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-black/5 px-3 py-2 w-full max-w-xl">
                          <div className="flex items-center gap-3">
                            {/* Photo thumbnail */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                              <img 
                                src={photoDataUrl} 
                                alt="Thumbnail" 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            {/* Description input */}
                            <div className="flex-1">
                              <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description"
                                className="h-10 border-0 bg-transparent text-black placeholder-gray-600 focus-visible:ring-0 p-0 text-base"
                              />
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                                onClick={startSpeechRecognition}
                                disabled={isListening}
                                aria-label="Dictate"
                              >
                                {isListening ? (
                                  <MicOff className="h-5 w-5 text-red-500" />
                                ) : (
                                  <Mic className="h-5 w-5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                                aria-label="Keyboard"
                              >
                                <Keyboard className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                                onClick={handleDescriptionDrawing}
                                aria-label="Draw"
                              >
                                <Pencil className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                                onClick={handleTagsOpen}
                                aria-label="Tags"
                              >
                                <Tag className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                          {/* Selected tags quick chips */}
                          {selectedTags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedTags.slice(0, 4).map((tag) => (
                                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {tag}
                                </span>
                              ))}
                              {selectedTags.length > 4 && (
                                <span className="text-xs text-gray-600">+{selectedTags.length - 4} more</span>
                              )}
                            </div>
                          )}
                          {/* Actions: always visible */}
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSkipSaveAndContinue}
                              className="h-8 px-2 text-gray-700"
                            >
                              Skip
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleDescriptionSave}
                              className="h-8 px-3 bg-[#a4c639] hover:bg-[#8aaa2a] text-black"
                            >
                              Done
                            </Button>
                          </div>
                          {isListening && (
                            <div className="mt-1 text-center">
                              <span className="text-xs text-red-500 animate-pulse">Listening…</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Old bottom controls removed in favor of floating popup */}
            </div>
          )}
        </div>
      </DrawerContent>

      {/* Tags Drawer */}
      <Drawer open={showTagsDrawer} onOpenChange={setShowTagsDrawer}>
        <DrawerContent className="h-[80vh] max-h-[80vh]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTagsClose}
              >
                <X className="h-6 w-6" />
              </Button>
              <DrawerTitle>Tags</DrawerTitle>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Search bar */}
            <div className="p-4 border-b">
              <Input
                placeholder="Find or create a tag..."
                className="w-full"
              />
            </div>

            {/* Tags list - simple white background, black text, 1px border; 2px on hover */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {availableTags.map((tag) => {
                const selected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`w-full text-left px-3 py-2 rounded-md bg-white text-black border ${selected ? 'border-black' : 'border-black/50'} hover:border-2 hover:border-black transition-colors`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>

            {/* Selected tags summary */}
            {selectedTags.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600 mb-2">
                  Selected ({selectedTags.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTagToggle(tag)
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        aria-label={`Remove tag ${tag}`}
                        title={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </Drawer>
  )
}
