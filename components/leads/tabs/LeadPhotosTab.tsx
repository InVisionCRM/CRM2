"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Camera, Upload, X, Info, Trash2, Check, Share2, Copy, Link, Mail, Download, Crop, Pencil, Type, Plus } from "lucide-react"
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
  useEffect(() => {
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
            leadId: photo.leadId
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

    if (leadId) {
      fetchPhotos()
    }
  }, [leadId])

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
          uploadedPhotos.push(result.photo)
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
      // Manually add new photos to state to avoid re-fetching everything
      const newPhotos: Photo[] = uploadedPhotos.map(p => ({
        id: p.id,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
        leadId: p.leadId,
      }));

      setPhotos(prev => [...newPhotos, ...prev]);

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
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {isSelectionMode && selectedPhotos.size > 0 && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeletingBulk}
                className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Delete ({selectedPhotos.size})
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs">
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Share 
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={() => handleSharePhotos(photos.filter(p => selectedPhotos.has(p.id)))}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share photos
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleGmailShare(photos.filter(p => selectedPhotos.has(p.id)))}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Share via Gmail
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      const selectedUrls = photos
                        .filter(p => selectedPhotos.has(p.id))
                        .map(p => p.url)
                        .join('\n')
                      navigator.clipboard.writeText(selectedUrls)
                      toast({
                        title: "Links copied",
                        description: `${selectedPhotos.size} photo URL${selectedPhotos.size > 1 ? 's' : ''} copied to clipboard`,
                      })
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy links
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {photos.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectionMode}
              className={isSelectionMode ? "bg-muted" : ""}
            >
              {isSelectionMode ? "Cancel" : "Select"}
            </Button>
          )}
          <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-[#59ff00] text-black hover:bg-[#59ff00]/90">
            <Plus className="h-4 w-4 mr-2" />
            Upload Photos
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No photos available.</p>
          <p className="text-sm text-muted-foreground mt-1">Upload photos to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
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
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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