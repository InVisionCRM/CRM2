"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Keyboard, Pencil, Tag, Camera, X, ChevronLeft } from "lucide-react"
import PhotoCanvas from "./photo-canvas"
import { useLead } from "@/hooks/use-lead"
import { uploadSinglePhoto, updatePhoto } from "@/app/actions/photo-actions"

interface TakePhotoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  onPhotoSaved?: (photo: {
    id: string
    url: string
    thumbnailUrl: string
    name: string
    description: string | null
    createdAt: string
    leadId: string
  }) => void
}

export default function TakePhotoModal({ open, onOpenChange, leadId, onPhotoSaved }: TakePhotoModalProps) {
  const { lead } = useLead(leadId)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [photoTaken, setPhotoTaken] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTagsDrawer, setShowTagsDrawer] = useState(false)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [lastPhoto, setLastPhoto] = useState<{ id: string; url: string } | null>(null)
  const [quickEditOpen, setQuickEditOpen] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDrawDialogOpen, setIsDrawDialogOpen] = useState(false)

  const availableTags = [
    "Back Side","Before and After","Bottom","Clock In","Clock Out","Document","East Side",
    "Finished","Front Side","Left Side","New","North Side","Old","Receipt","Right Side",
    "South Side","Start","Top","West Side"
  ]

  // Start/stop camera with modal
  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        if (!open) return
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        if (cancelled) return
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch {
        // silently ignore
      }
    }
    if (open) {
      start()
    }
    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      setPhotoTaken(false)
      setPhotoDataUrl("")
      setDescription("")
      setShowDescriptionPopup(false)
      setIsListening(false)
      setSelectedTags([])
      setShowTagsDrawer(false)
    }
  }, [open])

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
    setTimeout(() => setShowDescriptionPopup(true), 200)
  }

  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: unknown) => {
      try {
        const results = (event as { results?: ArrayLike<{ 0?: { transcript?: string } }> }).results
        const first = results && (results[0] as { 0?: { transcript?: string } })
        const transcript = first?.[0]?.transcript
        if (typeof transcript === "string") {
          setDescription((prev) => prev + (prev ? " " : "") + transcript)
        }
      } catch {}
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const resetForNextShot = () => {
    setPhotoTaken(false)
    setPhotoDataUrl("")
    setDescription("")
    setShowDescriptionPopup(false)
    setIsListening(false)
    setSelectedTags([])
    setShowTagsDrawer(false)
    setIsDrawing(false)
  }

  const savePhoto = async () => {
    if (!photoDataUrl) return
    let base64Data = photoDataUrl
    if (base64Data.includes(",")) base64Data = base64Data.split(",")[1]
    const mergedDescription = selectedTags.length > 0 ? `${description ? `${description} ` : ""}[${selectedTags.join(", ")}]` : description
    // Build filename: Leads lastname-image-#
    const lastName = (lead?.lastName || "photo").toString().trim().replace(/\s+/g, "_")
    const counter = Math.floor(Date.now() / 1000) % 100000 // simple monotonic-ish suffix to avoid collisions
    const serialized = {
      name: `${lastName}-image-${counter}.jpg`,
      type: "image/jpeg",
      size: Math.ceil((base64Data.length * 3) / 4),
      base64Data,
    }
    const result = await uploadSinglePhoto(leadId, serialized, mergedDescription)
    if (result.success && result.photo) {
      const saved = {
        id: result.photo.id,
        url: result.photo.url,
        thumbnailUrl: result.photo.thumbnailUrl || result.photo.url,
        name: result.photo.name,
        description: result.photo.description,
        createdAt: result.photo.createdAt.toISOString(),
        leadId: result.photo.leadId,
      }
      setLastPhoto({ id: saved.id, url: saved.url })
      setSaveNotice("Saved")
      setTimeout(() => setSaveNotice(null), 1200)
      onPhotoSaved?.(saved)
      resetForNextShot()
    }
  }

  const handleQuickEditSave = async (annotatedImageUrl: string) => {
    if (!lastPhoto) return
    try {
      await updatePhoto(lastPhoto.id, { imageData: annotatedImageUrl })
      setLastPhoto({ ...lastPhoto, url: annotatedImageUrl })
      setQuickEditOpen(false)
      setSaveNotice("Updated")
      setTimeout(() => setSaveNotice(null), 1200)
    } catch {}
  }

  // Save drawing onto the current captured image (pre-save flow)
  const handleCurrentDrawSave = (annotatedImageUrl: string) => {
    setPhotoDataUrl(annotatedImageUrl)
    setIsDrawing(false)
    setIsDrawDialogOpen(false)
    setShowDescriptionPopup(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 m-0 max-w-full w-full h-[100vh] rounded-none overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Take Photo</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-full bg-black">
          <video ref={videoRef} className="w-full h-full object-cover bg-black" playsInline autoPlay muted />
          {/* Persistent capture bar to avoid layout reflows hiding it */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none">
            <div className="h-28" />
          </div>

          {/* Shutter */}
          <div className="fixed bottom-6 left-0 right-0 z-[60] flex items-center justify-center gap-6">
            <Button
              onClick={takePhoto}
              className="bg-lime-400 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white/30"
              type="button"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>

          {/* Floating Description Popup */}
          {photoTaken && !isDrawDialogOpen && showDescriptionPopup && (
            <div className="fixed left-0 right-0 bottom-24 z-50 flex justify-center px-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-black/5 px-3 py-2 w-full max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={photoDataUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description"
                      className="h-10 border-0 bg-transparent text-black placeholder-gray-600 focus-visible:ring-0 p-0 text-base"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                      onClick={startSpeechRecognition}
                      disabled={isListening}
                      aria-label="Dictate"
                    >
                      {isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full" aria-label="Keyboard">
                      <Keyboard className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                      onClick={() => { setShowDescriptionPopup(false); setIsDrawing(true); setIsDrawDialogOpen(true) }}
                      aria-label="Draw"
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-gray-700 hover:bg-gray-100 rounded-full"
                      onClick={() => setShowTagsDrawer(true)}
                      aria-label="Tags"
                    >
                      <Tag className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {selectedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTags.slice(0, 4).map((t) => (
                      <span key={t} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {t}
                      </span>
                    ))}
                    {selectedTags.length > 4 && <span className="text-xs text-gray-600">+{selectedTags.length - 4} more</span>}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={savePhoto} className="h-8 px-2 text-gray-700">
                    Skip
                  </Button>
                  <Button size="sm" onClick={savePhoto} className="h-8 px-3 bg-[#a4c639] hover:bg-[#8aaa2a] text-black">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Draw dialog over current capture */}
          <Dialog open={isDrawDialogOpen} onOpenChange={(open) => { setIsDrawDialogOpen(open); if (!open) { setIsDrawing(false); setShowDescriptionPopup(true) } }}>
            <DialogContent className="p-0 m-0 max-w-full w-full h-[100svh] rounded-none overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Draw</DialogTitle>
              </DialogHeader>
              <div className="relative w-full h-full">
                {/* Back button overlay */}
                <button className="absolute top-4 left-4 z-10 bg-white/90 text-black rounded px-3 py-1 shadow" onClick={() => { setIsDrawDialogOpen(false); setIsDrawing(false); setShowDescriptionPopup(true) }} aria-label="Back">Back</button>
                <PhotoCanvas 
                  imageUrl={photoDataUrl} 
                  onSave={handleCurrentDrawSave} 
                  saveLabel="Save" 
                  undoLabel="Undo"
                  overlayControls
                  fullScreen
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Save confirmation */}
          {saveNotice && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 text-white text-sm px-3 py-1.5 rounded-full">
              {saveNotice}
            </div>
          )}

          {/* Last photo thumbnail bottom-left */}
          {lastPhoto && (
            <button
              type="button"
              onClick={() => setQuickEditOpen(true)}
              className="fixed bottom-4 left-4 w-16 h-16 rounded-md overflow-hidden border border-white/50 shadow"
              title="Edit last photo"
            >
              <img src={lastPhoto.url} alt="Last" className="w-full h-full object-cover" />
            </button>
          )}

          {/* Quick edit overlay for last photo (annotation only) */}
          {quickEditOpen && lastPhoto && (
            <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
              <div className="relative w-full max-w-2xl bg-background rounded-md p-4">
                <button className="absolute top-2 right-2" onClick={() => setQuickEditOpen(false)} aria-label="Close">
                  <X className="h-5 w-5 text-white" />
                </button>
                <PhotoCanvas imageUrl={lastPhoto.url} onSave={handleQuickEditSave} />
              </div>
            </div>
          )}

          {/* Simple tags chooser */}
          {showTagsDrawer && (
            <div className="fixed inset-0 z-[55] bg-black/60 flex items-end md:items-center md:justify-center">
              <div className="w-full md:max-w-md bg-white rounded-t-lg md:rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b">
                  <Button variant="ghost" size="icon" onClick={() => setShowTagsDrawer(false)} aria-label="Back">
                    <ChevronLeft className="h-5 w-5 text-black" />
                  </Button>
                  <span className="text-black font-semibold">Tags</span>
                  <Button variant="ghost" size="icon" onClick={() => setShowTagsDrawer(false)} aria-label="Close">
                    <X className="h-5 w-5 text-black" />
                  </Button>
                </div>
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {availableTags.map((tag) => {
                    const selected = selectedTags.includes(tag)
                    return (
                      <label
                        key={tag}
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-md bg-white text-black border ${selected ? 'border-black' : 'border-black/50'} hover:border-2 hover:border-black transition-colors`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleTagToggle(tag)}
                          className="h-4 w-4 accent-black"
                        />
                        <span className="text-sm">{tag}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


