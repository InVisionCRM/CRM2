"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { format } from "date-fns"
import { Loader2, Save, AtSign, Users, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Form schema
const noteFormSchema = z.object({
  content: z.string().min(1, "Note content is required").max(1000, "Note content is too long"),
})

type NoteFormValues = z.infer<typeof noteFormSchema>

interface ApiNote {
  id: string;
  content: string;
  createdAt: string; // Assuming ISO string from API
  userId: string;
  leadId: string;
  user?: { // Optional user details
    name?: string | null;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface LeadNotesTabProps {
  leadId: string
}

export function LeadNotesTab({ leadId }: LeadNotesTabProps) {
  const [notes, setNotes] = useState<ApiNote[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  })

  // Fetch users for @mentions
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true)
      try {
        const response = await fetch('/api/users/search?query=');
        if (response.ok) {
          const userData = await response.json();
          console.log('Loaded users:', userData); // Debug log
          setUsers(userData);
        } else {
          console.error('Failed to fetch users:', response.status, response.statusText);
          toast({
            title: "Warning",
            description: "Could not load team members for @mentions",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Warning", 
          description: "Could not load team members for @mentions",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers();
  }, [toast]);

  useEffect(() => {
    async function fetchNotes() {
      if (!leadId) return;
      
      setIsLoadingNotes(true);
      try {
        const response = await fetch(`/api/leads/${leadId}/notes`);
        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }
        const notesData = await response.json();
        setNotes(notesData);
      } catch (error) {
        toast({
          title: "Error fetching notes",
          description: error instanceof Error ? error.message : "Could not load notes.",
          variant: "destructive",
        });
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoadingNotes(false);
      }
    }
    fetchNotes();
  }, [leadId, toast]);

  // Handle @mention input with better detection
  const handleTextareaChange = (value: string) => {
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z\s]*)$/);
    
    console.log('Checking for @mention:', { textBeforeCursor, atMatch }); // Debug log
    
    if (atMatch) {
      setShowMentionDropdown(true);
      setMentionQuery(atMatch[1]);
      setCursorPosition(cursorPos);
      console.log('Found @mention:', atMatch[1]); // Debug log
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  // Insert mention into textarea
  const insertMention = (user: User, fromDropdown = false) => {
    const currentValue = form.getValues('content');
    if (!textareaRef.current) return;
    
    let newValue: string;
    let newCursorPos: number;
    
    if (fromDropdown) {
      // Insert at current cursor position
      const cursorPos = textareaRef.current.selectionStart;
      const beforeCursor = currentValue.substring(0, cursorPos);
      const afterCursor = currentValue.substring(cursorPos);
      newValue = `${beforeCursor}@${user.name} ${afterCursor}`;
      newCursorPos = beforeCursor.length + (user.name?.length || 0) + 2;
    } else {
      // Replace the @mention being typed
      const beforeCursor = currentValue.substring(0, cursorPosition);
      const afterCursor = currentValue.substring(cursorPosition);
      const beforeAt = beforeCursor.replace(/@[a-zA-Z\s]*$/, '');
      newValue = `${beforeAt}@${user.name} ${afterCursor}`;
      newCursorPos = beforeAt.length + (user.name?.length || 0) + 2;
    }
    
    form.setValue('content', newValue);
    setShowMentionDropdown(false);
    setMentionQuery("");
    
    // Focus back to textarea and set cursor position
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

  const onSubmit = async (data: NoteFormValues) => {
    setIsSavingNote(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }
      
      // Refresh notes list
      const notesResponse = await fetch(`/api/leads/${leadId}/notes`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        setNotes(notesData);
      }
      
      toast({
        title: "Note Added",
        description: "Your note has been saved successfully.",
      })
      form.reset()
    } catch (error) {
      toast({
        title: "Error Saving Note",
        description: error instanceof Error ? error.message : "Failed to save note. Please try again.",
        variant: "destructive",
      })
      console.error("Error saving note:", error)
    } finally {
      setIsSavingNote(false)
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Add New Note
            <AtSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-normal text-muted-foreground">Use @name to mention team members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel className="sr-only">Note Content</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="Enter your notes here... Use @name to mention team members"
                          className="min-h-[120px] resize-none pr-12"
                          disabled={isSavingNote}
                          {...field}
                          ref={textareaRef}
                          onChange={(e) => {
                            field.onChange(e);
                            handleTextareaChange(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            // Handle escape to close dropdown
                            if (e.key === 'Escape' && showMentionDropdown) {
                              setShowMentionDropdown(false);
                              setMentionQuery("");
                            }
                          }}
                        />
                        
                        {/* User Dropdown Button */}
                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={isLoadingUsers || users.length === 0}
                              >
                                {isLoadingUsers ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Users className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {users.length === 0 ? (
                                <DropdownMenuItem disabled>
                                  No team members found
                                </DropdownMenuItem>
                              ) : (
                                users.map((user) => (
                                  <DropdownMenuItem
                                    key={user.id}
                                    onClick={() => insertMention(user, true)}
                                    className="flex items-center gap-2"
                                  >
                                    <AtSign className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.name || user.email}</span>
                                      {user.name && (
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                      )}
                                    </div>
                                  </DropdownMenuItem>
                                ))
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                    
                    {/* @Mention Dropdown */}
                    {showMentionDropdown && filteredUsers.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredUsers.slice(0, 5).map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => insertMention(user, false)}
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
                  </FormItem>
                )}
              />
              
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
                <Button
                  type="submit"
                  disabled={isSavingNote}
                >
                  {isSavingNote ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Save Note</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingNotes ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-md space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No notes have been added yet.</p>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 border border-border shadow-sm"
                >
                  <div className="whitespace-pre-wrap mb-2 text-sm leading-relaxed">
                    {renderNoteContent(note.content)}
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="font-medium">{note.user?.name || note.userId}</span>
                    <span title={new Date(note.createdAt).toLocaleString()}>
                      {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 