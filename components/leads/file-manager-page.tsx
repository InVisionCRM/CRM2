"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Search, Grid3X3, List, Upload, Camera, Download, Trash2, Eye, Filter, ChevronDown, Share2, Copy, Mail, Crop, Pencil, Type, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useLeadFiles } from "@/hooks/use-lead-files"
import { getLeadPhotos, uploadSinglePhoto, deletePhoto, updatePhoto } from "@/app/actions/photo-actions"
import { useWindowSize } from "@/hooks/use-window-size"
import ReactConfetti from "react-confetti"
import ReactCrop, { type Crop as ReactCropType } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import PhotoCanvas from "@/components/photos/photo-canvas"
import Image from "next/image"

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  claimNumber: string
  status: string
}

interface Photo {
  id: string
  name: string
  url: string
  thumbnailUrl: string
  size: number
  createdAt: string
  mimeType: string
  description?: string | null
  uploadedBy?: {
    name: string | null
    image: string | null
  } | null
  leadId: string
}

interface PhotoUpdate {
  description?: string | null
  imageData?: string
}

interface UnifiedFile {
  id: string
  name: string
  type: 'photo' | 'document'
  source: 'blob' | 'drive'
  url: string
  thumbnailUrl?: string
  size: number
  uploadedAt: string
  mimeType: string
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'photos' | 'files' | 'contracts'

interface FileManagerPageProps {
  lead: Lead
}

// Helper function to load image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img') as HTMLImageElement
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
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

// Helper function to create Gmail share link
function createGmailShareLink(photos: Photo[], claimNumber?: string): string {
  const subject = encodeURIComponent(`Photos for Claim ${claimNumber || 'N/A'}`)
  const body = encodeURIComponent(`Please find the attached photos for claim ${claimNumber || 'N/A'}:\n\n${photos.map(p => `${p.name}: ${p.url}`).join('\n\n')}`)
  return `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`
}

// Helper function to download image
async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error downloading image:', error)
  }
}

// Helper function to detect contract files
function isContractFile(filename: string): boolean {
  const contractKeywords = ['contract', 'signed contract', 'agreement', 'proposal', 'estimate']
  const lowercaseFilename = filename.toLowerCase()
  return contractKeywords.some(keyword => lowercaseFilename.includes(keyword))
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

export function FileManagerPage({ lead }: FileManagerPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { width, height } = useWindowSize()
  
  // File management hooks
  const { files, isLoading: isLoadingFiles, refreshFiles, deleteFile } = useLeadFiles(lead.id)
  
  // Local state
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [currentUploadingFile, setCurrentUploadingFile] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadType, setUploadType] = useState<'photos' | 'files'>('files')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load photos on mount
  useEffect(() => {
    const loadPhotos = async () => {
      setIsLoadingPhotos(true)
      try {
        const result = await getLeadPhotos(lead.id)
        if (result.success && result.photos) {
          setPhotos(result.photos.map(photo => ({
            id: photo.id,
            name: photo.name,
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl || photo.url,
            size: photo.size || 0,
            createdAt: photo.createdAt.toString(),
            mimeType: photo.mimeType || 'image/jpeg',
            description: photo.description,
            uploadedBy: photo.uploadedBy,
            leadId: photo.leadId
          })))
        }
      } catch (error) {
        console.error('Error loading photos:', error)
      } finally {
        setIsLoadingPhotos(false)
      }
    }

    loadPhotos()
  }, [lead.id])

  // Combine photos and files into unified list
  const unifiedFiles: UnifiedFile[] = [
    // Photos from blob storage
    ...photos.map(photo => ({
      id: photo.id,
      name: photo.name,
      type: 'photo' as const,
      source: 'blob' as const,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      size: photo.size,
      uploadedAt: photo.createdAt,
      mimeType: photo.mimeType
    })),
    // Files from Google Drive
    ...files.map(file => ({
      id: file.id,
      name: file.name,
      type: 'document' as const, // All Drive files are documents
      source: 'drive' as const,
      url: file.url,
      thumbnailUrl: (file as any).thumbnailLink, // Use thumbnailLink from the extended properties
      size: file.size,
      uploadedAt: file.uploadedAt.toString(),
      mimeType: file.type
    }))
  ]

  // Filter and search files
  const filteredFiles = unifiedFiles.filter(file => {
    // Filter by type - fix the comparison to match the correct values
    if (activeFilter !== 'all') {
      if (activeFilter === 'photos' && file.type !== 'photo') {
        return false
      }
      if (activeFilter === 'files' && file.type !== 'document') {
        return false
      }
    }
    
    // Search filter
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  // Get counts for tabs
  const photosCount = unifiedFiles.filter(f => f.type === 'photo').length
  const filesCount = unifiedFiles.filter(f => f.type === 'document').length

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFilesToUpload(Array.from(event.target.files))
      setIsUploadDialogOpen(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setFilesToUpload(files)
      setIsUploadDialogOpen(true)
    }
  }

  const openUploadDialog = (type: 'photos' | 'files') => {
    setUploadType(type)
    setFilesToUpload([])
    setIsUploadDialogOpen(true)
  }

  const handleUpload = async () => {
    if (filesToUpload.length === 0) return

    setIsUploading(true)
    setUploadProgress({})
    let successCount = 0

    // Filter files based on upload type
    const filteredFiles = uploadType === 'photos' 
      ? filesToUpload.filter(file => file.type.startsWith('image/'))
      : filesToUpload.filter(file => !file.type.startsWith('image/'))

    if (filteredFiles.length === 0) {
      toast({
        title: "No valid files",
        description: uploadType === 'photos' 
          ? "Please select image files for photo upload."
          : "Please select non-image files for file upload.",
        variant: "destructive"
      })
      setIsUploading(false)
      return
    }

    for (let i = 0; i < filteredFiles.length; i++) {
      const file = filteredFiles[i]
      const fileKey = `${file.name}-${i}`
      setCurrentUploadingFile(file.name)
      setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))

      try {
        if (uploadType === 'photos' && file.type.startsWith('image/')) {
          // Upload as photo to blob storage with progress simulation
          const buffer = await file.arrayBuffer()
          
          // Simulate progress for blob upload (since we can't track actual progress)
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const currentProgress = prev[fileKey] || 0
              if (currentProgress < 90) {
                return { ...prev, [fileKey]: currentProgress + 10 }
              }
              return prev
            })
          }, 100)

          const base64Data = Buffer.from(buffer).toString('base64')
          const serializedFile = {
            name: file.name,
            type: file.type,
            size: file.size,
            base64Data
          }
          
          const result = await uploadSinglePhoto(lead.id, serializedFile)
          
          clearInterval(progressInterval)
          
          if (result.success) {
            setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))
            successCount++
          } else {
            setUploadProgress(prev => ({ ...prev, [fileKey]: -1 })) // Error state
          }
        } else if (uploadType === 'files') {
          // Upload as file to Google Drive with progress tracking
          const formData = new FormData()
          formData.append('file', file)
          formData.append('leadId', lead.id)
          formData.append('fileType', 'file')

          // Create XMLHttpRequest for progress tracking
          const xhr = new XMLHttpRequest()
          
          const uploadPromise = new Promise<boolean>((resolve, reject) => {
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100)
                setUploadProgress(prev => ({ ...prev, [fileKey]: percentComplete }))
              }
            })

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))
                resolve(true)
              } else {
                setUploadProgress(prev => ({ ...prev, [fileKey]: -1 })) // Error state
                reject(new Error(`HTTP ${xhr.status}`))
              }
            })

            xhr.addEventListener('error', () => {
              setUploadProgress(prev => ({ ...prev, [fileKey]: -1 })) // Error state
              reject(new Error('Network error'))
            })

            xhr.open('POST', '/api/files/upload-to-shared-drive')
            xhr.send(formData)
          })

          const success = await uploadPromise
          if (success) {
            successCount++
          }
        }
      } catch (error) {
        console.error('Upload error:', error)
        setUploadProgress(prev => ({ ...prev, [fileKey]: -1 })) // Error state
      }
    }

    setIsUploading(false)
    setCurrentUploadingFile('')
    
    // Keep progress visible for a moment before closing
    setTimeout(() => {
      setIsUploadDialogOpen(false)
      setFilesToUpload([])
      setUploadProgress({})
    }, 1500)

    if (successCount > 0) {
      toast({
        title: "Upload Successful",
        description: `${successCount} file(s) uploaded successfully.`
      })
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      
      // Refresh both photos and files
      await refreshFiles()
      const result = await getLeadPhotos(lead.id)
      if (result.success && result.photos) {
        setPhotos(result.photos.map(photo => ({
          id: photo.id,
          name: photo.name,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl || photo.url,
          size: photo.size || 0,
          createdAt: photo.createdAt.toString(),
          mimeType: photo.mimeType || 'image/jpeg',
          description: photo.description,
          uploadedBy: photo.uploadedBy,
          leadId: photo.leadId
        })))
      }
    }

    if (successCount < filteredFiles.length) {
      toast({
        title: "Some uploads failed",
        description: `${filteredFiles.length - successCount} file(s) failed to upload.`,
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (file: UnifiedFile) => {
    try {
      if (file.source === 'blob') {
        const result = await deletePhoto(file.id)
        if (result.success) {
          setPhotos(prev => prev.filter(p => p.id !== file.id))
          toast({ title: "Photo deleted successfully" })
        }
      } else {
        const result = await deleteFile(file.id)
        if (result.success) {
          toast({ title: "File deleted successfully" })
        }
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive"
      })
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const result = await deletePhoto(photoId)
      if (result.success) {
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        toast({ title: "Photo deleted successfully" })
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete photo",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting photo:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete photo",
        variant: "destructive"
      })
    }
  }

  const handleUpdatePhoto = async (photoId: string, updates: PhotoUpdate) => {
    try {
      const result = await updatePhoto(photoId, updates)
      
      if (result.success && result.photo) {
        // Update the local state with the updated photo
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId 
            ? { 
                ...photo, 
                description: result.photo.description,
                url: result.photo.url || photo.url,
                thumbnailUrl: result.photo.thumbnailUrl || photo.thumbnailUrl
              }
            : photo
        ))

        // Also update the selected photo if it's the one being edited
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(prev => prev ? {
            ...prev,
            description: result.photo.description,
            url: result.photo.url || prev.url,
            thumbnailUrl: result.photo.thumbnailUrl || prev.thumbnailUrl
          } : null)
        }

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

  const handleDownload = (file: UnifiedFile) => {
    if (file.source === 'drive') {
      // For Drive files, open in new tab for download
      window.open(file.url, '_blank')
    } else {
      // For blob photos, direct download
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      link.click()
    }
  }

  const renderFileCard = (file: UnifiedFile) => {
    const isSelected = selectedFiles.has(file.id)
    
    const handleFileClick = () => {
      if (file.source === 'blob') {
        // Find the full photo object and open in PhotoDialog
        const photo = photos.find(p => p.id === file.id)
        if (photo) {
          openPhotoDialog(photo)
        }
      } else {
        // For Drive files, open externally in new tab
        window.open(file.url, '_blank', 'noopener,noreferrer')
      }
    }
    
    return (
      <Card 
        key={file.id} 
        className={`group cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={handleFileClick}
      >
        <CardContent className="p-3">
          <div className="aspect-square mb-2 bg-muted rounded-md overflow-hidden flex items-center justify-center">
            {file.thumbnailUrl ? (
              <img 
                src={file.thumbnailUrl} 
                alt={file.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-2xl">
                {file.type === 'photo' ? '📷' : '📄'}
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="font-medium text-sm truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {file.source === 'blob' ? 'Photo' : 'Drive'}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {file.source === 'blob' ? (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  const photo = photos.find(p => p.id === file.id)
                  if (photo) {
                    openPhotoDialog(photo)
                  }
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(file.url, '_blank', 'noopener,noreferrer')
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(file)
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderListItem = (file: UnifiedFile) => {
    const handleFileClick = () => {
      if (file.source === 'blob') {
        const photo = photos.find(p => p.id === file.id)
        if (photo) {
          openPhotoDialog(photo)
        }
      } else {
        // For Drive files, open externally in new tab
        window.open(file.url, '_blank', 'noopener,noreferrer')
      }
    }

    return (
      <div 
        key={file.id} 
        className="flex items-center justify-between p-3 border-b hover:bg-muted/50 cursor-pointer"
        onClick={handleFileClick}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-xl">
            {file.type === 'photo' ? '📷' : '📄'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()} • 
              <Badge variant="secondary" className="ml-1 text-xs">
                {file.source === 'blob' ? 'Photo' : 'Drive'}
              </Badge>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {file.source === 'blob' ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                const photo = photos.find(p => p.id === file.id)
                if (photo) {
                  openPhotoDialog(photo)
                }
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                window.open(file.url, '_blank', 'noopener,noreferrer')
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Open
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(file)
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const openPhotoDialog = (photo: Photo) => {
    setSelectedPhoto(photo)
    setIsPhotoDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {showConfetti && <ReactConfetti width={width} height={height} numberOfPieces={100} recycle={false} />}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/leads/${lead.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lead
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {lead.firstName} {lead.lastName} - Files & Photos
            </h1>
            <p className="text-muted-foreground">
              📁 Claim #{lead.claimNumber} • {lead.status} • {lead.email}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
        <TabsList>
          <TabsTrigger value="all">All ({unifiedFiles.length})</TabsTrigger>
          <TabsTrigger value="photos">📷 Photos ({photosCount})</TabsTrigger>
          <TabsTrigger value="files">📄 Files ({filesCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {isLoadingFiles || isLoadingPhotos ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading files...</p>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <div className="text-6xl mb-4">
                  {activeFilter === 'photos' ? '📷' : activeFilter === 'files' ? '📄' : '📁'}
                </div>
                <p className="text-muted-foreground mb-4">
                  {activeFilter === 'photos' 
                    ? 'No photos found.' 
                    : activeFilter === 'files' 
                      ? 'No files found.'
                      : 'No files found.'}
                </p>
                {(activeFilter === 'photos' || activeFilter === 'files') && (
                  <Button 
                    onClick={() => openUploadDialog(activeFilter)}
                    className="mb-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {activeFilter === 'photos' ? 'Photos' : 'Files'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload button for current tab */}
              {(activeFilter === 'photos' || activeFilter === 'files') && (
                <div className="flex justify-end">
                  <Button 
                    onClick={() => openUploadDialog(activeFilter)}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {activeFilter === 'photos' ? 'Photos' : 'Files'}
                  </Button>
                </div>
              )}
              
              {/* File grid/list */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredFiles.map(renderFileCard)}
                </div>
              ) : (
                <div className="border rounded-lg">
                  {filteredFiles.map(renderListItem)}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload {uploadType === 'photos' ? 'Photos' : 'Files'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Drag and Drop Area */}
            {filesToUpload.length === 0 && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-4xl mb-4">
                  {uploadType === 'photos' ? '📷' : '📄'}
                </div>
                <p className="text-lg font-medium mb-2">
                  Drag and drop {uploadType === 'photos' ? 'photos' : 'files'} here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose {uploadType === 'photos' ? 'Photos' : 'Files'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {uploadType === 'photos' 
                    ? 'Supports: JPG, PNG, GIF, WebP' 
                    : 'Supports: PDF, DOC, DOCX, XLS, XLSX, TXT, and more'}
                </p>
              </div>
            )}
            
            {filesToUpload.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Files to upload:</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {filesToUpload.map((file, index) => {
                    const fileKey = `${file.name}-${index}`
                    const progress = uploadProgress[fileKey] || 0
                    const isError = progress === -1
                    const isComplete = progress === 100
                    const isCurrentlyUploading = currentUploadingFile === file.name && isUploading
                    const isValidFile = uploadType === 'photos' 
                      ? file.type.startsWith('image/') 
                      : !file.type.startsWith('image/')
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className={`flex items-center justify-between p-2 rounded ${
                          isValidFile ? 'bg-muted' : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-sm">
                              {file.type.startsWith('image/') ? '📷' : '📄'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm truncate block">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isValidFile ? (
                              <span className="text-xs text-red-600">Invalid type</span>
                            ) : isError ? (
                              <span className="text-xs text-red-600">Failed</span>
                            ) : isComplete ? (
                              <span className="text-xs text-green-600">✓ Complete</span>
                            ) : isCurrentlyUploading ? (
                              <span className="text-xs text-blue-600">Uploading...</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Waiting</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {isValidFile && (isUploading || isComplete || isError) && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isError 
                                  ? 'bg-red-500' 
                                  : isComplete 
                                    ? 'bg-green-500' 
                                    : 'bg-blue-500'
                              }`}
                              style={{ 
                                width: `${isError ? 100 : Math.max(progress, 0)}%` 
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Progress Text */}
                        {isValidFile && (isUploading || isComplete || isError) && (
                          <div className="text-xs text-center text-muted-foreground">
                            {isError ? 'Upload failed' : `${Math.max(progress, 0)}%`}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Add more files button */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3"
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add More {uploadType === 'photos' ? 'Photos' : 'Files'}
                </Button>
              </div>
            )}
            
            {/* Overall Status */}
            {isUploading && currentUploadingFile && (
              <div className="text-sm text-center text-blue-600 font-medium">
                Currently uploading: {currentUploadingFile}
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Cancel'}
              </Button>
            </DialogClose>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || filesToUpload.length === 0}
            >
              {isUploading ? 'Uploading...' : `Upload ${filesToUpload.length} file(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        aria-label="File upload input"
        title="Select files to upload"
        accept={uploadType === 'photos' ? 'image/*' : '*'}
      />

      {/* Photo Dialog */}
      <PhotoDialog
        photo={selectedPhoto}
        isOpen={isPhotoDialogOpen}
        onClose={() => setIsPhotoDialogOpen(false)}
        onDelete={handleDeletePhoto}
        onUpdate={handleUpdatePhoto}
        claimNumber={lead.claimNumber}
      />
    </div>
  )
} 