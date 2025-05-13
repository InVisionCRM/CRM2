"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AddNoteProps {
  leadId: string
  onSuccess?: () => void
}

export function AddNote({ leadId, onSuccess }: AddNoteProps) {
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!note.trim()) {
      toast({
        title: "Note required",
        description: "Please enter a note before submitting.",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: note })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to add note")
      }
      
      // Success handling
      setNote("")
      toast({
        title: "Note added",
        description: "Your note has been added successfully."
      })
      
      // Trigger callback if provided (e.g., to refresh activity feed)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add Note</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Textarea
            placeholder="Enter note details here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[50px]"
            disabled={isSubmitting}
          />
        </CardContent>
        <CardFooter className="items-end justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !note.trim()}
            className="flex items-center gap-2 text-black"
          >
            <span>{isSubmitting ? "Adding..." : "Add Note"}</span>
            <Send className="w-4 h-4 text-black" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 