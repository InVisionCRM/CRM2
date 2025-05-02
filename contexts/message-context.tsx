"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { Message, MessageContextType } from "@/types/message"
import { mockMessages } from "@/lib/mock-messages"
import { v4 as uuidv4 } from "uuid"

const MessageContext = createContext<MessageContextType | undefined>(undefined)

export function MessageProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>(mockMessages)

  const unreadCount = messages.filter((message) => !message.isRead).length

  const toggleMessagePanel = () => {
    setIsOpen(!isOpen)
  }

  const closeMessagePanel = () => {
    setIsOpen(false)
  }

  const sendMessage = (content: string) => {
    if (!content.trim()) return

    const newMessage: Message = {
      id: uuidv4(),
      content,
      authorId: "currentUser", // In a real app, this would be the current user's ID
      authorName: "You", // In a real app, this would be the current user's name
      authorAvatar: "/placeholder.svg?height=40&width=40",
      createdAt: new Date(),
      isRead: true, // User's own messages are automatically read
    }

    setMessages((prevMessages) => [newMessage, ...prevMessages])
  }

  const markAsRead = (id: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) => (message.id === id ? { ...message, isRead: true } : message)),
    )
  }

  // Add event listener for ESC key to close panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeMessagePanel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <MessageContext.Provider
      value={{
        isOpen,
        toggleMessagePanel,
        closeMessagePanel,
        unreadCount,
        messages,
        sendMessage,
        markAsRead,
      }}
    >
      {children}
    </MessageContext.Provider>
  )
}

export function useMessage() {
  const context = useContext(MessageContext)
  if (context === undefined) {
    throw new Error("useMessage must be used within a MessageProvider")
  }
  return context
}
