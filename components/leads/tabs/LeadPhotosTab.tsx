"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Camera, Upload, X, Info, Trash2, Check, Share2, Copy, Link, Mail, Download, Crop, Pencil, Type, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { getLeadPhotos, uploadSinglePhoto, deletePhoto, updatePhoto } from "@/app/actions/photo-actions"
import ReactCrop, { type Crop as ReactCropType } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import PhotoCanvas from "@/components/photos/photo-canvas"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// Types for photos
interface Photo {
  id: string
  url: string
  thumbnailUrl: string
  name: string
  description: string | null
  createdAt: string
  uploadedBy?: {
    name: string | null
    image: string | null
  } | null
  leadId: string
  category?: string
}

// Add new interface for photo updates
interface PhotoUpdate {
  description?: string | null
  imageData?: string
}

// Add new interface for serialized file data
interface SerializedFile {
  name: string
  type: string
  size: number
  base64Data: string
}

interface PhotoDialogProps {
  photo: Photo | null
  isOpen: boolean
  onClose: () => void
  onDelete?: (photoId: string) => void
  onUpdate?: (photoId: string, updates: PhotoUpdate) => void
  canDelete?: boolean
  claimNumber?: string
}

interface LeadPhotosTabProps {
  leadId: string
  claimNumber?: string
}

interface UploadPreview {
  file: File
  previewUrl: string
  name: string
  originalName: string
}

// Add new interface for tracking individual file progress
interface UploadProgressTracker {
  preparing: number;
  uploading: number;
  finalizing: number;
}

// Helper function to create Gmail share link
const createGmailShareLink = (photos: Photo[], claimNumber?: string) => {
  const subject = encodeURIComponent(`Photos${claimNumber ? ` - Claim #${claimNumber}` : ''}`)
  const body = encodeURIComponent(
    `${claimNumber ? `Claim #${claimNumber}\n\n` : ''}` +
    photos.map(photo => `${photo.name}:\n${photo.url}`).join('\n\n')
  )
  return `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`
}

// Helper function to fetch image as blob
const fetchImageAsBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url)
  return response.blob()
}

// Helper function to download image
const downloadImage = async (url: string, filename: string) => {
  const blob = await fetchImageAsBlob(url)
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(blobUrl)
}

// Helper function to get cropped image data
function getCroppedImg(image: HTMLImageElement, crop: ReactCropType): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('No 2d context'))
      return
    }

    try {
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      )

      // Convert to base64 with high quality
      const base64 = canvas.toDataURL('image/jpeg', 0.95)
      resolve(base64)
    } catch (err) {
      reject(err)
    }
  })
}

// Helper function to load an image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.crossOrigin = "anonymous" // Enable CORS
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// PhotoDialog component
const PhotoDialog = ({ photo, isOpen, onClose, onDelete, onUpdate, canDelete = true, claimNumber }: PhotoDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [editMode, setEditMode] = useState<'crop' | 'draw' | 'caption' | null>(null)
  const [crop, setCrop] = useState<ReactCropType>()
  const [completedCrop, setCompletedCrop] = useState<ReactCropType>()
  const [editedImageUrl, setEditedImageUrl] = useState<string>('')
  const [caption, setCaption] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (photo) {
      setEditedImageUrl(photo.url)
      setCaption(photo.description || '')
      setCrop(undefined)
      setCompletedCrop(undefined)
    }
  }, [photo])

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !photo) return

    try {
      const img = await loadImage(photo.url)
      const croppedImageUrl = await getCroppedImg(img, completedCrop)
      
      // Save the cropped image
      setIsSaving(true)
      await onUpdate?.(photo.id, {
        imageData: croppedImageUrl,
        description: photo.description
      })

      setEditedImageUrl(croppedImageUrl)
      setEditMode(null)
      
      toast({
        title: "Success",
        description: "Image cropped successfully",
      })
    } catch (e) {
      console.error('Error cropping image:', e)
      toast({
        title: "Error",
        description: "Failed to crop image",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [completedCrop, photo, onUpdate, toast])

  const handleSaveAnnotations = async (annotatedImageUrl: string) => {
    if (!photo) return

    try {
      setIsSaving(true)
      await onUpdate?.(photo.id, {
        imageData: annotatedImageUrl,
        description: photo.description
      })

      setEditedImageUrl(annotatedImageUrl)
      setEditMode(null)

      toast({
        title: "Success",
        description: "Drawing saved successfully",
      })
    } catch (error) {
      console.error('Error saving drawing:', error)
      toast({
        title: "Error",
        description: "Failed to save drawing",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!photo || !onUpdate) return

    try {
      setIsSaving(true)
      
      // For caption changes, we don't need to include the image data
      await onUpdate(photo.id, {
        description: caption
      })

      toast({
        title: "Success",
        description: "Caption updated successfully",
      })
      
      setEditMode(null)
    } catch (error) {
      console.error('Error saving changes:', error)
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = async () => {
    if (!photo) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.name,
          text: photo.description || 'Check out this photo',
          url: photo.url,
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
          copyToClipboard()
        }
      }
    } else {
      copyToClipboard()
    }
  }

  const handleGmailShare = () => {
    if (!photo) return
    window.open(createGmailShareLink([photo], claimNumber), '_blank')
  }

  const copyToClipboard = () => {
    if (!photo) return
    navigator.clipboard.writeText(photo.url).then(() => {
      toast({
        title: "Link copied",
        description: "Photo URL has been copied to clipboard",
      })
    }).catch((error) => {
      console.error('Error copying to clipboard:', error)
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    })
  }

  const handleDelete = async () => {
    if (!photo || !onDelete) return
    
    try {
      setIsDeleting(true)
      await onDelete(photo.id)
      onClose()
    } catch (error) {
      console.error("Error deleting photo:", error)
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!photo) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 flex justify-between items-center">
          <DialogTitle className="text-lg">{photo.name}</DialogTitle>
          <div className="flex items-center gap-2">
            {!editMode && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share photo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGmailShare}>
                      <Mail className="h-4 w-4 mr-2" />
                      Share via Gmail
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditMode('crop')}>
                      <Crop className="h-4 w-4 mr-2" />
                      Crop
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditMode('draw')}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Draw
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditMode('caption')}>
                      <Type className="h-4 w-4 mr-2" />
                      Caption
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {canDelete && onDelete && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                if (editMode) {
                  setEditMode(null)
                  setEditedImageUrl(photo.url)
                  setCaption(photo.description || '')
                } else {
                  onClose()
                }
              }} 
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative flex-grow overflow-auto">
          {editMode === 'crop' ? (
            <div className="relative w-full h-full min-h-[50vh] bg-black flex flex-col">
              <div className="flex-grow relative overflow-hidden flex items-center justify-center p-4">
                <div className="relative max-h-[calc(100vh-16rem)] h-full w-full flex items-center justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="max-w-full max-h-full flex items-center justify-center"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="max-h-full max-w-full object-contain"
                      style={{ maxHeight: 'calc(100vh - 16rem)' }}
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                </div>
              </div>
              <div className="p-4 flex justify-end gap-2 bg-background/95 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditMode(null)
                    setEditedImageUrl(photo.url)
                    setCrop(undefined)
                    setCompletedCrop(undefined)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCropComplete}
                  disabled={!completedCrop?.width || !completedCrop?.height || isSaving}
                  className="bg-[#59ff00] text-black hover:bg-[#59ff00]/90"
                >
                  {isSaving ? "Saving..." : "Apply Crop"}
                </Button>
              </div>
            </div>
          ) : editMode === 'draw' ? (
            <PhotoCanvas
              imageUrl={editedImageUrl}
              onSave={handleSaveAnnotations}
              isSaving={isSaving}
            />
          ) : editMode === 'caption' ? (
            <div className="p-4 space-y-4">
              <div className="relative w-full h-[40vh]">
                <Image
                  src={editedImageUrl}
                  alt={photo.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption to this photo..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditMode(null)
                    setCaption(photo.description || '')
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-[#59ff00] text-black hover:bg-[#59ff00]/90"
                >
                  {isSaving ? "Saving..." : "Save Caption"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full min-h-[50vh]">
              <Image
                src={editedImageUrl}
                alt={photo.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
              />
            </div>
          )}
        </div>
        
        {!editMode && (
          <div className="p-4 bg-muted/30">
            {photo.description && (
              <p className="text-sm text-muted-foreground mb-2">{photo.description}</p>
            )}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Uploaded: {new Date(photo.createdAt).toLocaleString()}</span>
              {photo.uploadedBy?.name && (
                <span>By: {photo.uploadedBy.name}</span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// CameraModal for multi-capture with category selection
const PHOTO_CATEGORIES = [
  { value: "before build", label: "Before Build" },
  { value: "during build", label: "During Build" },
  { value: "after build", label: "After Build" },
  { value: "misc", label: "Misc" },
];

// Simple Draw Tool Modal
function DrawModal({ open, onClose, imageUrl, onSave }: {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (blob: Blob) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasDims, setCanvasDims] = useState({ width: 320, height: 320 });

  useEffect(() => {
    if (open && canvasRef.current && imageUrl) {
      const image = new window.Image();
      image.crossOrigin = "anonymous"; // Add CORS support
      image.onload = () => {
        // Fit image into a larger canvas, preserving aspect ratio
        const maxSize = Math.min(window.innerWidth - 40, 400);
        let w = maxSize, h = maxSize;
        if (image.width > image.height) {
          h = Math.round((image.height / image.width) * maxSize);
        } else if (image.height > image.width) {
          w = Math.round((image.width / image.height) * maxSize);
        }
        setCanvasDims({ width: w, height: h });
        setImg(image);
        const context = canvasRef.current!.getContext("2d");
        setCtx(context);
        if (context) {
          // Clear and resize canvas
          canvasRef.current!.width = w;
          canvasRef.current!.height = h;
          // Fill background white
          context.fillStyle = "#fff";
          context.fillRect(0, 0, w, h);
          // Draw image
          context.drawImage(image, 0, 0, w, h);
        }
      };
      image.onerror = (e) => {
        console.error("Failed to load image for drawing:", e);
        // Try to load as blob URL if direct URL fails
        if (!imageUrl.startsWith('blob:')) {
          fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
              const blobUrl = URL.createObjectURL(blob);
              image.src = blobUrl;
            })
            .catch(err => console.error("Failed to fetch image as blob:", err));
        }
      };
      image.src = imageUrl;
    }
  }, [open, imageUrl]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    setLastPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };
  const handlePointerUp = () => {
    setDrawing(false);
    setLastPos(null);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !ctx || !lastPos) return;
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    setLastPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };
  const handleClear = () => {
    if (ctx && img && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };
  const handleSave = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) onSave(blob);
      }, "image/jpeg", 0.95);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-full p-4 m-0 rounded-none overflow-hidden sm:max-w-md sm:h-auto sm:rounded-lg sm:m-6">
        <div className="flex flex-col items-center gap-4 h-full">
          <div className="flex-1 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={canvasDims.width}
              height={canvasDims.height}
              className="border rounded bg-white shadow-lg max-w-full max-h-full"
              style={{ touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerMove={handlePointerMove}
            />
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <Button 
              type="button" 
              onClick={handleClear} 
              variant="outline" 
              className="flex-1"
            >
              Clear
            </Button>
            <Button 
              type="button" 
              onClick={handleSave} 
              className="bg-lime-400 text-black hover:bg-lime-500 flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CameraModal({ open, onClose, onUpload, leadId }: {
  open: boolean;
  onClose: () => void;
  onUpload: (photos: { blob: Blob; category: string }[]) => Promise<void>;
  leadId: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<{ url: string; blob: Blob; category: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState(PHOTO_CATEGORIES[0].value);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawIdx, setDrawIdx] = useState<number | null>(null);
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [isCameraMinimized, setIsCameraMinimized] = useState(false);

  // Start camera on open
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
        } catch (e) {
          setError("Unable to access camera");
        }
      })();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCaptured([]);
      setError(null);
      setIsCameraMinimized(false);
    }
    // eslint-disable-next-line
  }, [open]);

  // Take photo
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setCaptured((prev) => [
            ...prev,
            { url: URL.createObjectURL(blob), blob, category: activeCategory },
          ]);
        }
      }, "image/jpeg", 0.95);
    }
  };

  // Remove photo
  const handleRemove = (idx: number) => {
    setCaptured((prev) => prev.filter((_, i) => i !== idx));
  };

  // Change category for a photo
  const handleCategoryChange = (idx: number, category: string) => {
    setCaptured((prev) => prev.map((p, i) => i === idx ? { ...p, category } : p));
  };

  // Upload all
  const handleUploadAll = async () => {
    setIsUploading(true);
    await onUpload(captured);
    setIsUploading(false);
    onClose();
  };

  // Replace photo with drawn version
  const handleDrawSave = (blob: Blob) => {
    if (drawIdx === null) return;
    setCaptured((prev) => prev.map((p, i) =>
      i === drawIdx ? { ...p, url: URL.createObjectURL(blob), blob } : p
    ));
    setDrawModalOpen(false);
    setDrawIdx(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full h-full p-0 m-0 rounded-none overflow-hidden sm:max-w-lg sm:h-auto sm:rounded-lg sm:m-6" style={{ maxWidth: 'none' }}>
        <div className="flex flex-col h-[100vh] sm:h-[80vh] bg-gray-500">
          <div className={`flex flex-col items-center justify-center relative ${isCameraMinimized ? 'h-32' : 'flex-1'} min-h-0 transition-all duration-300`}>
            {error ? (
              <div className="text-red-500 text-center p-8">{error}</div>
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-cover bg-black"
                playsInline
                autoPlay
                muted
                style={{ minHeight: isCameraMinimized ? '8rem' : '60vh' }}
              />
            )}
            <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-2">
              <div className="flex gap-2 justify-center">
                {PHOTO_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${activeCategory === cat.value ? "bg-lime-400 text-black border-lime-400" : "bg-black/60 text-white border-white/20"}`}
                    onClick={() => setActiveCategory(cat.value)}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {captured.length > 0 && (
                  <Button
                    onClick={() => setIsCameraMinimized(!isCameraMinimized)}
                    className="bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30"
                    type="button"
                  >
                    {isCameraMinimized ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-1 bg-white rounded mb-0.5"></div>
                        <div className="w-3 h-1 bg-white rounded"></div>
                      </div>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleCapture}
                  className="bg-lime-400 text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white/30"
                  type="button"
                  disabled={!!error}
                  style={{ minWidth: 64, minHeight: 64 }}
                >
                  <Camera className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </div>
          {/* Thumbnails and category selectors */}
          {captured.length > 0 && (
            <div className={`bg-black/80 p-2 flex flex-col gap-2 overflow-y-auto ${isCameraMinimized ? 'flex-1' : 'max-h-56'} transition-all duration-300`}>
              <div className="grid grid-cols-4 gap-2 pb-2">
                {captured.map((photo, idx) => (
                  <div key={idx} className="relative flex flex-col items-center">
                    <div className="relative">
                      <img 
                        src={photo.url} 
                        alt="Captured" 
                        className="w-full aspect-square object-cover rounded-md border border-white/20 transition-all duration-300" 
                      />
                      {/* Delete button */}
                      <button
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 text-xs shadow-lg z-10"
                        onClick={() => handleRemove(idx)}
                        type="button"
                        title="Delete photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {/* Draw/Pencil button */}
                      <button
                        className="absolute top-1 left-1 bg-black/70 text-white rounded-full p-1 text-xs shadow-lg z-10"
                        onClick={() => { setDrawIdx(idx); setDrawModalOpen(true); }}
                        type="button"
                        title="Draw on photo"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                    <select
                      className="mt-1 w-full text-xs rounded bg-black/80 text-white border border-white/20 px-1 py-0.5 transition-all duration-300"
                      value={photo.category}
                      onChange={e => handleCategoryChange(idx, e.target.value)}
                      title="Select photo category"
                    >
                      {PHOTO_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleUploadAll}
                disabled={isUploading || captured.length === 0}
                className="w-full bg-lime-400 text-black font-bold mt-2"
              >
                {isUploading ? "Uploading..." : `Upload All (${captured.length})`}
              </Button>
              {/* Draw Tool Modal */}
              {drawIdx !== null && captured[drawIdx] && (
                <DrawModal
                  open={drawModalOpen}
                  onClose={() => { setDrawModalOpen(false); setDrawIdx(null); }}
                  imageUrl={captured[drawIdx].url}
                  onSave={handleDrawSave}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main PhotosTab component
export function LeadPhotosTab({ leadId, claimNumber }: LeadPhotosTabProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadPreviews, setUploadPreviews] = useState<UploadPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUploadingFile, setCurrentUploadingFile] = useState<string | null>(null)
  const progressInterval = useRef<NodeJS.Timeout>()
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [moveCategory, setMoveCategory] = useState<string>("");
  const [isMoveDropdownOpen, setIsMoveDropdownOpen] = useState(false);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [])

  const simulateProgress = (start: number, end: number, duration: number) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    const step = (end - start) / (duration / 50) // Update every 50ms
    let current = start

    progressInterval.current = setInterval(() => {
      current += step
      if (current >= end) {
        current = end
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
        }
      }
      setUploadProgress(Math.min(Math.round(current), end))
    }, 50)
  }

  // Fetch photos
  const fetchPhotos = async () => {
    if (!leadId) {
      setError("Lead ID is required")
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const result = await getLeadPhotos(leadId)
      if (result.success && result.photos) {
        // Transform the photos to match our interface
        const transformedPhotos: Photo[] = result.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl || photo.url,
          name: photo.name,
          description: photo.description,
          createdAt: photo.createdAt.toISOString(),
          uploadedBy: photo.uploadedBy,
          leadId: photo.leadId,
          category: photo.category
        }))
        setPhotos(transformedPhotos)
      } else {
        setError(result.error || "Failed to fetch photos")
      }
    } catch (error) {
      console.error("Error fetching photos:", error)
      setError("Failed to fetch photos")
    } finally {
      setIsLoading(false)
    }
  }

  // Ensure photos are fetched on mount and when leadId changes
  useEffect(() => {
    if (leadId) {
      fetchPhotos();
    }
  }, [leadId]);

  // Function to create file previews
  const createPreviews = (files: File[]) => {
    const previews: UploadPreview[] = []
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          previews.push({
            file,
            previewUrl: e.target.result as string,
            name: file.name.replace(/\.[^/.]+$/, ""),
            originalName: file.name
          })
          if (previews.length === files.length) {
            setUploadPreviews(previews)
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Focus input when editing name
  useEffect(() => {
    if (editingNameIndex !== null && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingNameIndex])

  const handleNameEdit = (index: number, newName: string) => {
    setUploadPreviews(prev => prev.map((preview, i) => {
      if (i === index) {
        const extension = preview.originalName.split('.').pop() || ''
        return {
          ...preview,
          name: newName,
          file: new File([preview.file], `${newName}.${extension}`, { type: preview.file.type })
        }
      }
      return preview
    }))
    setUploadFiles(prev => prev.map((file, i) => {
      if (i === index) {
        const extension = uploadPreviews[index].originalName.split('.').pop() || ''
        return new File([file], `${newName}.${extension}`, { type: file.type })
      }
      return file
    }))
    setEditingNameIndex(null)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      handleNameEdit(index, e.currentTarget.value)
    } else if (e.key === 'Escape') {
      setEditingNameIndex(null)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)
      setUploadFiles(files)
      createPreviews(files)
    }
  }

  const removePreview = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
    setUploadPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!leadId) {
      toast({ title: "Error", description: "Lead ID is required", variant: "destructive" })
      return
    }
    
    if (uploadFiles.length === 0) {
      toast({ title: "No files selected", description: "Please select at least one photo to upload", variant: "destructive" })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    const totalFiles = uploadFiles.length
    const uploadedPhotos = []
    const failedUploads = []

    for (let i = 0; i < totalFiles; i++) {
      const file = uploadFiles[i]
      const preview = uploadPreviews[i]
      setCurrentUploadingFile(`Uploading ${preview.name} (${i + 1}/${totalFiles})...`)
      
      try {
        // Prepare file for upload
        const buffer = await file.arrayBuffer()
        const base64Data = Buffer.from(buffer).toString('base64')
        const serializedFile = {
          name: preview.name, // Use the (possibly edited) name from preview
          type: file.type,
          size: file.size,
          base64Data
        }

        // Upload photo
        const result = await uploadSinglePhoto(leadId, serializedFile)
        
        if (result.success && result.photo) {
          const newPhoto = {
            id: result.photo.id,
            url: result.photo.url,
            thumbnailUrl: result.photo.thumbnailUrl || result.photo.url,
            name: result.photo.name,
            description: result.photo.description,
            createdAt: result.photo.createdAt.toISOString(),
            uploadedBy: result.photo.uploadedBy,
            leadId: result.photo.leadId,
            category: result.photo.category
          };
          setPhotos(prev => [newPhoto, ...prev]);
          uploadedPhotos.push(newPhoto)
        } else {
          throw new Error(result.error || `Failed to upload ${file.name}`)
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        failedUploads.push(file.name)
      } finally {
        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 100)
      }
    }

    setIsUploading(false)
    setCurrentUploadingFile(null)

    // Show results
    if (uploadedPhotos.length > 0) {
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${uploadedPhotos.length} photo${uploadedPhotos.length > 1 ? 's' : ''}.`,
      })
    }

    if (failedUploads.length > 0) {
      toast({
        title: "Some uploads failed",
        description: `Failed to upload: ${failedUploads.join(", ")}`,
        variant: "destructive",
      })
    }

    // Close dialog and reset state
    if (failedUploads.length === 0) {
      setIsUploadDialogOpen(false)
      setUploadFiles([])
      setUploadPreviews([])
      setUploadProgress(0)
    }
  }

  const openPhotoDialog = (photo: Photo) => {
    setSelectedPhoto(photo)
    setIsPhotoDialogOpen(true)
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const result = await deletePhoto(photoId)
      
      if (result.success) {
        // Remove the photo from the state
        setPhotos(photos.filter(photo => photo.id !== photoId))
        
        toast({
          title: "Photo deleted",
          description: "Photo has been deleted successfully",
        })
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete photo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting photo:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete photo",
        variant: "destructive",
      })
    }
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedPhotos(new Set())
  }

  const togglePhotoSelection = (photoId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening the photo dialog
    const newSelection = new Set(selectedPhotos)
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId)
    } else {
      newSelection.add(photoId)
    }
    setSelectedPhotos(newSelection)
  }

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return

    try {
      setIsDeletingBulk(true)
      let successCount = 0
      let errorCount = 0

      for (const photoId of selectedPhotos) {
        try {
          const result = await deletePhoto(photoId)
          if (result.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch {
          errorCount++
        }
      }

      // Update the photos list by removing deleted photos
      setPhotos(photos.filter(photo => !selectedPhotos.has(photo.id)))
      setSelectedPhotos(new Set())
      setIsSelectionMode(false)
      setIsDeleteDialogOpen(false)

      // Show result toast
      if (successCount > 0) {
        toast({
          title: "Photos deleted",
          description: `Successfully deleted ${successCount} photo${successCount > 1 ? 's' : ''}${
            errorCount > 0 ? `. Failed to delete ${errorCount} photo${errorCount > 1 ? 's' : ''}.` : ''
          }`,
          variant: errorCount > 0 ? "destructive" : "default",
        })
      } else {
        toast({
          title: "Delete failed",
          description: "Failed to delete selected photos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting photos:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete selected photos",
        variant: "destructive",
      })
    } finally {
      setIsDeletingBulk(false)
    }
  }

  const handleSharePhotos = async (photos: Photo[]) => {
    if (photos.length === 0) return

    try {
      // Try native share first
      if (navigator.share && navigator.canShare) {
        // Fetch all images as files
        const files = await Promise.all(
          photos.map(async (photo) => {
            const blob = await fetchImageAsBlob(photo.url)
            return new File([blob], photo.name, { type: blob.type })
          })
        )

        const shareData = {
          files,
          title: photos.length === 1 ? 'Shared Photo' : 'Shared Photos',
          text: photos.length === 1 ? 'Here is the photo I wanted to share with you.' : 'Here are the photos I wanted to share with you.'
        }

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          return
        }
      }

      // Fallback to downloading files
      if (photos.length === 1) {
        await downloadImage(photos[0].url, photos[0].name)
      } else {
        // For multiple photos, download them sequentially
        toast({
          title: "Downloading photos",
          description: "Your photos will begin downloading shortly...",
        })
        
        for (const photo of photos) {
          await downloadImage(photo.url, photo.name)
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error)
        toast({
          title: "Error",
          description: "Failed to share photos",
          variant: "destructive",
        })
      }
    }
  }

  const handleUpdatePhoto = async (photoId: string, updates: PhotoUpdate) => {
    try {
      const result = await updatePhoto(photoId, updates)
      
      if (result.success && result.photo) {
        // Update the local state with the updated photo
        setPhotos(photos.map(photo => 
          photo.id === photoId 
            ? { 
                ...photo, 
                description: result.photo.description,
                url: result.photo.url || photo.url,
                thumbnailUrl: result.photo.thumbnailUrl || photo.thumbnailUrl
              }
            : photo
        ))

        toast({
          title: "Success",
          description: "Photo updated successfully",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating photo:', error)
      toast({
        title: "Error",
        description: "Failed to update photo",
        variant: "destructive",
      })
    }
  }

  const handleGmailShare = (photos: Photo[]) => {
    window.open(createGmailShareLink(photos, claimNumber), '_blank')
  }

  // Helper: filter photos by category
  const filterPhotosByCategory = (photos: Photo[], category: string) => {
    if (category === "all") return photos;
    const match = (str: string | null | undefined) =>
      str && str.toLowerCase().includes(category.replace(/_/g, " ").toLowerCase());
    return photos.filter(
      (photo) =>
        (photo.category && photo.category.toLowerCase() === category.toLowerCase()) ||
        (!photo.category && (match(photo.name) || match(photo.description)))
    );
  };

  // Handle upload from camera modal
  const handleCameraModalUpload = async (photos: { blob: Blob; category: string }[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    let uploadedCount = 0;
    for (const { blob, category } of photos) {
      try {
        const buffer = await blob.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const serializedFile = {
          name: `${category.replace(/ /g, '_')}_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: blob.size,
          base64Data,
          category,
        };
        await uploadSinglePhoto(leadId, serializedFile);
      } catch (e) {
        // Optionally show error toast
      }
      uploadedCount++;
      setUploadProgress(Math.round((uploadedCount / photos.length) * 100));
    }
    // After all uploads, fetch the latest photos from backend
    await fetchPhotos();
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentUploadingFile(null);
    toast({ title: "Photos uploaded", description: `${photos.length} photo(s) uploaded.` });
  };

  // Move selected photos to a new category
  const handleMoveCategory = async (category: string) => {
    setIsMoveDropdownOpen(false);
    setMoveCategory("");
    // For each selected photo, update its category (frontend only for now)
    setPhotos((prev) =>
      prev.map((photo) =>
        selectedPhotos.has(photo.id)
          ? { ...photo, category }
          : photo
      )
    );
    setSelectedPhotos(new Set());
    setIsSelectionMode(false);
    toast({ title: "Photos moved", description: `Moved to ${category}` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Camera Modal */}
      <CameraModal
        open={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onUpload={handleCameraModalUpload}
        leadId={leadId}
      />
      {/* Category Tabs */}
      <div className="overflow-x-auto pb-2 -mx-2">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-2 min-w-[400px] sm:min-w-0 px-2">
          <TabsList className="flex w-full min-w-[400px] sm:grid sm:grid-cols-5 gap-1 whitespace-nowrap">
            <TabsTrigger value="before build" className="px-3 py-2 text-xs sm:text-sm">Before Build</TabsTrigger>
            <TabsTrigger value="during build" className="px-3 py-2 text-xs sm:text-sm">During Build</TabsTrigger>
            <TabsTrigger value="after build" className="px-3 py-2 text-xs sm:text-sm">After Build</TabsTrigger>
            <TabsTrigger value="misc" className="px-3 py-2 text-xs sm:text-sm">Misc</TabsTrigger>
            <TabsTrigger value="all" className="px-3 py-2 text-xs sm:text-sm">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {/* Select and bulk action controls - single row, responsive */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center mb-2 w-full">
        <div className="flex flex-1 gap-2">
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className={isSelectionMode ? "bg-muted flex-1" : "flex-1"}
          >
            {isSelectionMode ? "Cancel" : "Select"}
          </Button>
          {isSelectionMode && selectedPhotos.size > 0 && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeletingBulk}
                className="h-10 flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedPhotos.size})
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={async (e) => {
                    e.stopPropagation();
                    await handleSharePhotos(photos.filter(p => selectedPhotos.has(p.id)))
                  }}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleGmailShare(photos.filter(p => selectedPhotos.has(p.id)))
                  }}>
                    <Mail className="h-4 w-4 mr-2" />
                    Share via Gmail
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Move to Category Dropdown */}
              <div className="relative flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 h-10 w-full"
                  onClick={() => setIsMoveDropdownOpen((v) => !v)}
                >
                  Move to Category <ChevronDown className="h-3 w-3" />
                </Button>
                {isMoveDropdownOpen && (
                  <div className="absolute z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-lg min-w-[160px]">
                    {PHOTO_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-lime-100 dark:hover:bg-lime-900"
                        onClick={() => handleMoveCategory(cat.value)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-1 gap-2">
          <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-[#59ff00] text-black hover:bg-[#59ff00]/90 flex-1 h-10">
            <Plus className="h-4 w-4 mr-2" />
            Upload Photos
          </Button>
          {/* Take Photos (Custom Camera UI) Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2 flex-1 h-10"
            onClick={() => setIsCameraModalOpen(true)}
          >
            <Camera className="h-4 w-4" />
            Take Photos
          </Button>
        </div>
      </div>
      {/* ...existing photo grid... */}
      {filterPhotosByCategory(photos, activeCategory).length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-8 px-2 my-2 min-h-[120px] max-w-xs mx-auto">
          <p className="text-muted-foreground text-center text-sm">No photos available.</p>
          <p className="text-xs text-muted-foreground mt-1 text-center">Upload photos to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filterPhotosByCategory(photos, activeCategory).map((photo) => (
            <Card 
              key={photo.id} 
              className={`group relative cursor-pointer overflow-hidden ${
                isSelectionMode ? 'ring-2 ring-muted' : ''
              } ${selectedPhotos.has(photo.id) ? 'ring-2 ring-primary' : ''}`}
              onClick={(event) => isSelectionMode ? togglePhotoSelection(photo.id, event!) : openPhotoDialog(photo)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                            {!isSelectionMode && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
              {/* Delete Button */}
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-8 w-8 bg-red-500/80 hover:bg-red-600 text-white" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePhoto(photo.id)
                }}
                title="Delete photo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {/* Share Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70">
                    <Share2 className="h-4 w-4 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={async (e) => {
                    e.stopPropagation()
                    await handleSharePhotos([photo])
                  }}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    handleGmailShare([photo])
                  }}>
                    <Mail className="h-4 w-4 mr-2" />
                    Share via Gmail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async (e) => {
                    e.stopPropagation()
                    await downloadImage(photo.url, photo.name)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(photo.url)
                    toast({
                      title: "Link copied",
                      description: "Photo URL has been copied to clipboard",
                    })
                  }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
                  {isSelectionMode ? (
                    <div 
                      className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
                        selectedPhotos.has(photo.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => togglePhotoSelection(photo.id, e)}
                    >
                      <div className={`rounded-full p-2 ${
                        selectedPhotos.has(photo.id) ? 'bg-primary' : 'bg-muted/50'
                      }`}>
                        <Check className={`h-6 w-6 ${
                          selectedPhotos.has(photo.id) ? 'text-primary-foreground' : 'text-muted-foreground'
                        }`} />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Info className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open)
        if (!open) {
          setUploadFiles([])
          setUploadPreviews([])
          setUploadProgress(0)
          if (progressInterval.current) {
            clearInterval(progressInterval.current)
          }
        }
      }}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <div>
              <Label htmlFor="photos">Select</Label>
              <Input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="mt-1.5"
              />
            </div>

            {/* Preview Grid */}
            {uploadPreviews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
                {uploadPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square border rounded-md overflow-hidden bg-muted">
                      <Image
                        src={preview.previewUrl}
                        alt={preview.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 16vw"
                      />
                      <button
                        onClick={() => removePreview(index)}
                        className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${preview.name}`}
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                    <div className="mt-0.5">
                      {editingNameIndex === index ? (
                        <Input
                          ref={nameInputRef}
                          defaultValue={preview.name}
                          onBlur={(e) => handleNameEdit(index, e.target.value)}
                          onKeyDown={(e) => handleNameKeyDown(e, index)}
                          className="h-6 text-xs py-0.5"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingNameIndex(index)}
                          className="w-full text-left text-[10px] text-muted-foreground group/name flex items-center gap-1 hover:text-foreground"
                          title="Click to edit name"
                        >
                          <div className="truncate flex-1">
                            {preview.name}
                            <span className="text-muted-foreground/50">
                              {`.${preview.originalName.split('.').pop()}`}
                            </span>
                          </div>
                          <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <Progress 
                  value={uploadProgress} 
                  className="h-2 transition-all duration-300"
                />
                {currentUploadingFile && (
                  <p className="text-sm text-muted-foreground text-center">
                    {currentUploadingFile}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/80 text-center">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                onClick={() => {
                  setUploadFiles([])
                  setUploadPreviews([])
                  setUploadProgress(0)
                  if (progressInterval.current) {
                    clearInterval(progressInterval.current)
                  }
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || uploadFiles.length === 0}
              className="bg-[#59ff00] text-black hover:bg-[#59ff00]/90"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading {uploadFiles.length} photo{uploadFiles.length > 1 ? 's' : ''}...
                </>
              ) : (
                `Upload ${uploadFiles.length} photo${uploadFiles.length > 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo View Dialog */}
      <PhotoDialog
        photo={selectedPhoto}
        isOpen={isPhotoDialogOpen}
        onClose={() => {
          setIsPhotoDialogOpen(false)
          setSelectedPhoto(null)
        }}
        onDelete={handleDeletePhoto}
        onUpdate={handleUpdatePhoto}
        claimNumber={claimNumber}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Photos</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedPhotos.size} selected photo{selectedPhotos.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
            >
              {isDeletingBulk ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 