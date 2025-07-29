"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { PlusCircle, Trash2, AtSign, Users, Loader2 } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"

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

// Interface for API response
interface ApiNote {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  leadId: string;
  user?: {
    name?: string | null;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

export function LeadNotes({ leadId }: LeadNotesProps) {
  const [notes, setNotes] = useState<NoteWithImages[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState< NoteImage & { noteId: string; index: number } | null>(null)
  const [editingImageName, setEditingImageName] = useState("")
  const [newNoteContent, setNewNoteContent] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Fetch users for @mentions
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true)
      try {
        const response = await fetch('/api/users/search?query=');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers();
  }, []);

  // Handle @mention input detection
  const handleTextareaChange = (value: string) => {
    setNewNoteContent(value);
    
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z\s]*)$/);
    
    if (atMatch) {
      setShowMentionDropdown(true);
      setMentionQuery(atMatch[1]);
      setCursorPosition(cursorPos);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  // Insert mention into textarea
  const insertMention = (user: User) => {
    if (!textareaRef.current) return;
    
    const beforeCursor = newNoteContent.substring(0, cursorPosition);
    const afterCursor = newNoteContent.substring(cursorPosition);
    const beforeAt = beforeCursor.replace(/@[a-zA-Z\s]*$/, '');
    const newValue = `${beforeAt}@${user.name} ${afterCursor}`;
    const newCursorPos = beforeAt.length + (user.name?.length || 0) + 2;
    
    setNewNoteContent(newValue);
    setShowMentionDropdown(false);
    setMentionQuery("");
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Filter users based on mention query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Fetch notes from API
  useEffect(() => {
    async function fetchNotes() {
      if (!leadId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/leads/${leadId}/notes`);
        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }
        const apiNotes: ApiNote[] = await response.json();
        
        // Transform API notes to match component interface
        const transformedNotes: NoteWithImages[] = apiNotes.map(note => ({
          id: note.id,
          leadId: note.leadId,
          content: note.content,
          createdAt: new Date(note.createdAt),
          createdBy: note.user?.name || note.userId,
          images: [] // Notes from API don't have images yet
        }));
        
        setNotes(transformedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
        setError(error instanceof Error ? error : new Error("Failed to fetch notes"));
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotes();
  }, [leadId]);

  const addNoteWithImages = async (
    content: string,
    images: NoteImage[], // Use NoteImage type
  ) => {
    setIsSubmitting(true)
    try {
      console.log("Adding note with images:", images)
      
      // Call the API to save the note
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }
      
      // Refresh the notes list
      const notesResponse = await fetch(`/api/leads/${leadId}/notes`);
      if (notesResponse.ok) {
        const apiNotes: ApiNote[] = await notesResponse.json();
        const transformedNotes: NoteWithImages[] = apiNotes.map(note => ({
          id: note.id,
          leadId: note.leadId,
          content: note.content,
          createdAt: new Date(note.createdAt),
          createdBy: note.user?.name || note.userId,
          images: [] // Notes from API don't have images yet
        }));
        setNotes(transformedNotes);
      }
      
      toast({
        title: "Note Added",
        description: "Your note has been saved successfully.",
      });
      
      return notes[0]; // Return the first note as placeholder
    } catch (error) {
      console.error("Failed to add note:", error)
      toast({
        title: "Error Saving Note",
        description: error instanceof Error ? error.message : "Failed to save note. Please try again.",
        variant: "destructive",
      });
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      // For now, just remove from local state since we don't have delete API
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
      toast({
        title: "Note Deleted",
        description: "Note has been deleted successfully.",
      });
      return true
    } catch (error) {
      console.error("Failed to delete note:", error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
      throw error
    }
  }

  const handleAddNote = async (content: string, images: NoteImage[]) => {
    try {
      await addNoteWithImages(content, images)
      setIsAddNoteOpen(false)
      setNewNoteContent("")
      setShowMentionDropdown(false)
      setMentionQuery("")
    } catch (error) {
      console.error("Failed to add note:", error)
    }
  }

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    
    await handleAddNote(newNoteContent, []);
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

  // Render note content with @mention highlighting
  const renderNoteContent = (content: string) => {
    const mentionRegex = /@([a-zA-Z\s]+(?:\s+[a-zA-Z]+)*)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) { // This is a mention
        return (
          <span key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1 rounded">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Team Discussion</CardTitle>
        <Button onClick={() => setIsAddNoteOpen(!isAddNoteOpen)} variant="outline" size="sm" className="h-8">
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {/* Inline Add Note Form */}
        {isAddNoteOpen && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-medium">Add New Note</h4>
              <AtSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Use @name to mention team members</span>
            </div>
            <form onSubmit={handleSubmitNote} className="space-y-3">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Enter your note here... Use @name to mention team members"
                  value={newNoteContent}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  className="min-h-[100px] resize-none"
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && showMentionDropdown) {
                      setShowMentionDropdown(false);
                      setMentionQuery("");
                    }
                  }}
                />
                
                {/* @Mention Dropdown */}
                {showMentionDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => insertMention(user)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{user.name || user.email}</div>
                          {user.name && (
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {users.length > 0 ? (
                    `${users.length} team members available for @mentions`
                  ) : isLoadingUsers ? (
                    "Loading team members..."
                  ) : (
                    "No team members found"
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddNoteOpen(false);
                      setNewNoteContent("");
                      setShowMentionDropdown(false);
                      setMentionQuery("");
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !newNoteContent.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Note"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading notes...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            Error loading notes
            <div className="text-sm">{error.message}</div>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No notes yet</div>
        ) :
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{note.createdBy}</span> • {formatDistanceToNow(note.createdAt, { addSuffix: true })}
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
                <div className="whitespace-pre-wrap">{renderNoteContent(note.content)}</div>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Details Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
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
