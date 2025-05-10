"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { PlusCircle, Trash2 } from "lucide-react"
import { NoteFormDrawer } from "./note-form-drawer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PhotoStage } from "@/types/photo"

interface LeadNotesProps {
  leadId: string
}

// Define interfaces for Note structure
interface NoteImage {
  url: string;
  name: string;
  stage: PhotoStage;
}

interface NoteWithImages {
  id: string;
  leadId: string;
  content: string;
  createdAt: Date; // Store as Date object
  createdBy: string;
  images: NoteImage[];
}

export function LeadNotes({ leadId }: LeadNotesProps) {
  // For now, let's use mock data directly in the component
  // This bypasses any API calls that might be causing validation errors
  const [notes, setNotes] = useState<NoteWithImages[]>([ // Use NoteWithImages type
    {
      id: "1",
      leadId,
      content:
        "Initial contact made with customer. They're interested in a roof inspection following recent storm damage.",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Store as Date
      createdBy: "John Doe",
      images: [],
    },
    {
      id: "2",
      leadId,
      content:
        "Scheduled an initial assessment for next week. Customer mentioned they've already filed an insurance claim.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Store as Date
      createdBy: "Jane Smith",
      images: [],
    },
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState< NoteImage & { noteId: string; index: number } | null>(null) // Adjusted type for selectedImage
  const [editingImageName, setEditingImageName] = useState("")

  const addNoteWithImages = async (
    content: string,
    images: NoteImage[], // Use NoteImage type
  ) => {
    setIsSubmitting(true)
    try {
      console.log("Adding note with images:", images)
      // Create a new note with mock data
      const newNote: NoteWithImages = { // Use NoteWithImages type
        id: Date.now().toString(),
        leadId,
        content,
        createdAt: new Date(), // Store as Date
        createdBy: "Current User", // TODO: Replace with actual session user if available
        images,
      }

      // Add it to our local state
      setNotes((prev) => [newNote, ...prev])
      return newNote
    } catch (error) {
      console.error("Failed to add note:", error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      // Remove from local state
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
      return true
    } catch (error) {
      console.error("Failed to delete note:", error)
      throw error
    }
  }

  const handleAddNote = async (content: string, images: NoteImage[]) => {
    try {
      await addNoteWithImages(content, images)
    } catch (error) {
      console.error("Failed to add note:", error)
    }
  }

  const handleDeleteNote = async () => {
    if (!noteToDelete) return

    try {
      await deleteNote(noteToDelete)
      setNoteToDelete(null)
    } catch (error) {
      console.error("Failed to delete note:", error)
    }
  }

  const handleImageClick = (image: NoteImage, noteId: string, index: number) => { // Use NoteImage type
    setSelectedImage({
      ...image, // Spread image properties
      noteId,
      index,
    })
    setEditingImageName(image.name)
  }

  const handleSaveImageDetails = () => {
    if (!selectedImage) return

    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === selectedImage.noteId) {
          const updatedImages = [...note.images]
          updatedImages[selectedImage.index] = {
            ...updatedImages[selectedImage.index],
            name: editingImageName,
            // Keep the original stage, don't allow editing it
            stage: updatedImages[selectedImage.index].stage,
          }
          return {
            ...note,
            images: updatedImages,
          }
        }
        return note
      }),
    )

    setSelectedImage(null)
  }

  // Helper function to get stage badge color
  const getStageBadgeColor = (stage: PhotoStage) => {
    switch (stage) {
      case PhotoStage.Before:
        return "bg-blue-500 hover:bg-blue-600"
      case PhotoStage.During:
        return "bg-amber-500 hover:bg-amber-600"
      case PhotoStage.After:
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Helper function to get stage display name
  const getStageDisplayName = (stage: PhotoStage) => {
    switch (stage) {
      case PhotoStage.Before:
        return "Before"
      case PhotoStage.During:
        return "During"
      case PhotoStage.After:
        return "After"
      default:
        return "Unknown"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Notes</CardTitle>
        <Button onClick={() => setIsAddNoteOpen(true)} variant="outline" size="sm" className="h-8">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading notes...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            Error loading notes
            <div className="text-sm">{error.message}</div>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No notes yet</div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-muted-foreground">
                    {note.createdBy} • {formatDistanceToNow(note.createdAt, { addSuffix: true })}{/* Use note.createdAt directly */}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => setNoteToDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="whitespace-pre-wrap">{note.content}</div>

                {note.images && note.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {note.images.map((img, index) => (
                      <div
                        key={index}
                        className="relative cursor-pointer rounded-md overflow-hidden border aspect-[4/3]"
                        onClick={() => handleImageClick(img, note.id, index)} // img should be NoteImage
                      >
                        <img
                          src={img.url || "/placeholder.svg"}
                          alt={img.name || `Note image ${index + 1}`}
                          className="w-full aspect-auto object-cover bg-gray-100"
                          onError={(e) => {
                            console.error("Image failed to load:", img.url)
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate flex justify-between items-center">
                          <span>{img.name || `Photo ${index + 1}`}</span>
                          {img.stage && (
                            <Badge className={`text-[0.65rem] px-1 py-0 h-4 ${getStageBadgeColor(img.stage)}`}>
                              {getStageDisplayName(img.stage)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <NoteFormDrawer
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        onSubmit={handleAddNote}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Photo Details</DialogTitle>
          </DialogHeader>

          {selectedImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage.url || "/placeholder.svg"}
                  alt={selectedImage.name}
                  className="max-h-[50vh] max-w-full object-contain rounded-md bg-gray-100"
                />
              </div>

              {/* Display the stage as a badge instead of editable radio buttons */}
              {selectedImage.stage && (
                <div className="flex items-center space-x-2">
                  <Label>Photo Stage:</Label>
                  <Badge className={getStageBadgeColor(selectedImage.stage)}>
                    {getStageDisplayName(selectedImage.stage)}
                  </Badge>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="imageName">Photo Name</Label>
                <Input
                  id="imageName"
                  value={editingImageName}
                  onChange={(e) => setEditingImageName(e.target.value)}
                  placeholder="Enter a name for this photo"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveImageDetails} className="bg-[#a4c639] hover:bg-[#8aaa2a] text-black">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
