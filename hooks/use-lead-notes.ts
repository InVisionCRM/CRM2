"use client"

import { useState, useEffect } from "react"
import type { Note } from "@/types/lead"

// Mock data for notes
const mockNotes: Record<string, Note[]> = {}

export function useLeadNotes(leadId: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [useMockData] = useState(true) // Set to true to use mock data, false for real API calls

  const fetchNotes = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (useMockData) {
        // Use mock data
        await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
        setNotes(mockNotes[leadId] || [])
      } else {
        // Use real API
        const response = await fetch(`/api/leads/${leadId}/notes`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to fetch notes")
        }

        const data = await response.json()
        setNotes(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      console.error("Error fetching notes:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (leadId) {
      fetchNotes()
    }
  }, [leadId])

  const addNote = async (content: string): Promise<Note> => {
    try {
      if (useMockData) {
        // Create a mock note
        const newNote: Note = {
          id: `note-${Date.now()}`,
          leadId,
          content,
          createdAt: new Date().toISOString(),
          createdBy: "Current User",
          updatedAt: new Date().toISOString(),
          images: [],
        }

        // Add to mock storage
        if (!mockNotes[leadId]) {
          mockNotes[leadId] = []
        }
        mockNotes[leadId].push(newNote)

        // Update state
        setNotes((prev) => [...prev, newNote])
        return newNote
      } else {
        // Use real API
        const response = await fetch(`/api/leads/${leadId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add note")
        }

        const newNote = await response.json()
        setNotes((prevNotes) => [...prevNotes, newNote])
        return newNote
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      console.error("Error adding note:", err)
      throw err
    }
  }

  const updateNote = async (noteId: string, content: string): Promise<Note> => {
    try {
      if (useMockData) {
        // Find and update the mock note
        if (!mockNotes[leadId]) {
          throw new Error("Note not found")
        }

        const noteIndex = mockNotes[leadId].findIndex((note) => note.id === noteId)
        if (noteIndex === -1) {
          throw new Error("Note not found")
        }

        const updatedNote: Note = {
          ...mockNotes[leadId][noteIndex],
          content,
          updatedAt: new Date().toISOString(),
        }

        mockNotes[leadId][noteIndex] = updatedNote

        // Update state
        setNotes((prev) => prev.map((note) => (note.id === noteId ? updatedNote : note)))
        return updatedNote
      } else {
        // Use real API
        const response = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to update note")
        }

        const updatedNote = await response.json()
        setNotes((prevNotes) => prevNotes.map((note) => (note.id === noteId ? updatedNote : note)))
        return updatedNote
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      console.error("Error updating note:", err)
      throw err
    }
  }

  const deleteNote = async (noteId: string): Promise<void> => {
    try {
      if (useMockData) {
        // Remove from mock storage
        if (mockNotes[leadId]) {
          mockNotes[leadId] = mockNotes[leadId].filter((note) => note.id !== noteId)
        }

        // Update state
        setNotes((prev) => prev.filter((note) => note.id !== noteId))
      } else {
        // Use real API
        const response = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to delete note")
        }

        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      console.error("Error deleting note:", err)
      throw err
    }
  }

  // New function to add a note with images
  const addNoteWithImages = async (content: string, images: string[]): Promise<Note> => {
    try {
      if (useMockData) {
        // Create a mock note with images
        const newNote: Note = {
          id: `note-${Date.now()}`,
          leadId,
          content,
          createdAt: new Date().toISOString(),
          createdBy: "Current User",
          updatedAt: new Date().toISOString(),
          images: images,
        }

        // Add to mock storage
        if (!mockNotes[leadId]) {
          mockNotes[leadId] = []
        }
        mockNotes[leadId].push(newNote)

        // Update state
        setNotes((prev) => [...prev, newNote])
        return newNote
      } else {
        // Use real API
        const response = await fetch(`/api/leads/${leadId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content, images }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add note")
        }

        const newNote = await response.json()
        setNotes((prevNotes) => [...prevNotes, newNote])
        return newNote
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      console.error("Error adding note with images:", err)
      throw err
    }
  }

  return {
    notes,
    isLoading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes: fetchNotes,
    addNoteWithImages,
  }
}
