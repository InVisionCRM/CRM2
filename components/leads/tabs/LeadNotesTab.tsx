"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { format } from "date-fns"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

interface LeadNotesTabProps {
  leadId: string
}

export function LeadNotesTab({ leadId }: LeadNotesTabProps) {
  const [notes, setNotes] = useState<ApiNote[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    }
  })

  useEffect(() => {
    async function fetchNotes() {
      if (!leadId) return;
      setIsLoadingNotes(true);
      try {
        // Replace with your actual API endpoint for fetching notes
        // const response = await fetch(`/api/leads/${leadId}/notes`);
        // if (!response.ok) throw new Error('Failed to fetch notes');
        // const data = await response.json();
        // setNotes(data);

        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 700));
        setNotes([
          {
            id: "1",
            content: "Initial contact made with homeowner. They mentioned hail damage on the north side of the roof. Discussed potential inspection next week.",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            userId: "user1",
            leadId: leadId,
            user: { name: "Jane Smith" }
          },
          {
            id: "2",
            content: "Follow-up call scheduled for Monday. Homeowner wants to involve their insurance company. Sent them our brochure.",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            userId: "user2",
            leadId: leadId,
            user: { name: "John Doe" }
          }
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

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

  const onSubmit = async (data: NoteFormValues) => {
    setIsSavingNote(true)
    try {
      // Replace with your actual API endpoint for saving notes
      // const response = await fetch(`/api/leads/${leadId}/notes`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // if (!response.ok) throw new Error('Failed to save note');
      // const newNote = await response.json();
      
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const newNote: ApiNote = {
        id: Date.now().toString(),
        content: data.content,
        createdAt: new Date().toISOString(),
        userId: "currentUser", // Replace with actual current user ID
        leadId: leadId,
        user: { name: "Current User" } // Replace with actual current user name
      }
      
      setNotes([newNote, ...notes])
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Note Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your notes here..."
                        className="min-h-[120px] resize-none"
                        disabled={isSavingNote}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
          <CardTitle>Note History</CardTitle>
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
                  <p className="whitespace-pre-wrap mb-2 text-sm leading-relaxed">{note.content}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{note.user?.name || note.userId}</span>
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