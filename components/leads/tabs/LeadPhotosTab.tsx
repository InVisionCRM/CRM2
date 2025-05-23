"use client"

import { useState, useEffect } from "react"
import { Camera, Upload, FolderPlus, X, Info, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
// Re-enable server actions now that the migration is applied
import { 
  checkPhotosFolder, 
  createPhotosFolder, 
  getLeadPhotos, 
  uploadPhotos,
  deletePhoto
} from "@/app/actions/photo-actions"

// Types for photos
interface Photo {
  id: string
  url: string
  thumbnailUrl: string
  name: string
  description: string
  createdAt: string
  uploadedBy?: {
    name: string | null
    image: string | null
  } | null
}

interface PhotoDialogProps {
  photo: Photo | null
  isOpen: boolean
  onClose: () => void
  onDelete?: (photoId: string) => void
  canDelete?: boolean
}

interface LeadPhotosTabProps {
  leadId: string
  googleDriveUrl?: string | null
}

// PhotoDialog component for viewing photos in full size
const PhotoDialog = ({ photo, isOpen, onClose, onDelete, canDelete = true }: PhotoDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  if (!photo) return null

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

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 flex justify-between items-center">
          <DialogTitle className="text-lg">{photo.name}</DialogTitle>
          <div className="flex items-center gap-2">
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
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative flex-grow overflow-auto">
          <div className="relative w-full h-full min-h-[50vh]">
            <Image
              src={photo.url}
              alt={photo.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
            />
          </div>
        </div>
        
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
      </DialogContent>
    </Dialog>
  )
}

// Main PhotosTab component
export function LeadPhotosTab({ leadId, googleDriveUrl }: LeadPhotosTabProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [hasFolderCreated, setHasFolderCreated] = useState(false)
  const [isFolderCreating, setIsFolderCreating] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Check if photos folder exists in Google Drive and fetch photos
  useEffect(() => {
    const checkFolder = async () => {
      if (!leadId) {
        setError("Lead ID is required")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        
        // Check if the Photos folder exists
        const folderResult = await checkPhotosFolder(leadId)
        
        if (folderResult.success && folderResult.hasFolder) {
          setHasFolderCreated(true)
          
          // Fetch photos
          const photosResult = await getLeadPhotos(leadId)
          
          if (photosResult.success) {
            setPhotos(photosResult.photos)
          } else {
            setError(photosResult.error || "Failed to fetch photos")
          }
        } else {
          setHasFolderCreated(false)
          if (!googleDriveUrl) {
            setError("No Google Drive folder set up for this lead")
          }
        }
      } catch (error) {
        console.error("Error checking photos folder:", error)
        setError("Failed to check if photos folder exists")
      } finally {
        setIsLoading(false)
      }
    }

    if (leadId) {
      checkFolder()
    }
  }, [googleDriveUrl, leadId])

  // Handle creating the Photos folder in Google Drive
  const handleCreatePhotosFolder = async () => {
    if (!leadId) {
      toast({
        title: "Error",
        description: "Lead ID is required",
        variant: "destructive",
      })
      return
    }
    
    try {
      setIsFolderCreating(true)
      
      const result = await createPhotosFolder(leadId)
      
      if (result.success) {
        setHasFolderCreated(true)
        toast({
          title: "Photos folder created",
          description: "You can now upload photos for this lead",
        })
        
        // Refresh photos (should be empty for a new folder)
        const photosResult = await getLeadPhotos(leadId)
        if (photosResult.success) {
          setPhotos(photosResult.photos)
        }
      } else {
        toast({
          title: "Error creating folder",
          description: result.error || "Failed to create photos folder",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating photos folder:", error)
      toast({
        title: "Error creating folder",
        description: "Failed to create photos folder",
        variant: "destructive",
      })
    } finally {
      setIsFolderCreating(false)
    }
  }

  // Handle photo upload
  const handleUpload = async () => {
    if (!leadId) {
      toast({
        title: "Error",
        description: "Lead ID is required",
        variant: "destructive",
      })
      return
    }
    
    try {
      if (uploadFiles.length === 0) {
        toast({
          title: "No files selected",
          description: "Please select at least one photo to upload",
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)
      
      // Prepare files for upload by converting them to serializable objects
      const serializedFiles = await Promise.all(
        Array.from(uploadFiles).map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            arrayBuffer
          };
        })
      );
      
      // Upload photos to Google Drive
      const result = await uploadPhotos(leadId, serializedFiles, description)
      
      if (result.success) {
        // Refresh photos
        const photosResult = await getLeadPhotos(leadId)
        
        if (photosResult.success) {
          setPhotos(photosResult.photos)
        }
        
        // Close dialog and reset state
        setIsUploadDialogOpen(false)
        setUploadFiles([])
        setDescription("")
        
        toast({
          title: "Photos uploaded",
          description: `Successfully uploaded ${uploadFiles.length} photo${uploadFiles.length > 1 ? 's' : ''}`,
        })
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload photos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error uploading photos:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload photos",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUploadFiles(Array.from(event.target.files))
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error && !googleDriveUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Info className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-muted-foreground">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          A Google Drive folder must be set up for this lead before photos can be added.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Info className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-muted-foreground">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          There was an issue accessing the photos. Please try again later.
        </p>
      </div>
    )
  }

  if (!hasFolderCreated && googleDriveUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FolderPlus className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Photos Folder Yet</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          This lead has a Google Drive folder, but no Photos folder has been created yet.
        </p>
        <Button 
          onClick={handleCreatePhotosFolder} 
          disabled={isFolderCreating}
          className="gap-2"
        >
          {isFolderCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Creating...
            </>
          ) : (
            <>
              <FolderPlus className="h-4 w-4" />
              Create Photos Folder
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lead Photos</h3>
        <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Photos
        </Button>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg bg-muted/20">
          <Camera className="h-16 w-16 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No photos yet</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            Upload your first photo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card 
              key={photo.id} 
              className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => openPhotoDialog(photo)}
            >
              <CardContent className="p-0 relative pb-[75%]">
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 25vw"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo upload dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="photos">Select Photos</Label>
              <Input 
                id="photos" 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                You can select multiple photos to upload at once
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for these photos"
                rows={3}
                disabled={isUploading}
              />
            </div>
            
            {uploadFiles.length > 0 && (
              <div className="text-sm">
                <p className="font-medium">{uploadFiles.length} file(s) selected</p>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                  {Array.from(uploadFiles).slice(0, 3).map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                  {uploadFiles.length > 3 && <li>...and {uploadFiles.length - 3} more</li>}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isUploading}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo view dialog */}
      <PhotoDialog 
        photo={selectedPhoto} 
        isOpen={isPhotoDialogOpen} 
        onClose={() => setIsPhotoDialogOpen(false)} 
        onDelete={handleDeletePhoto}
      />
    </div>
  )
} 