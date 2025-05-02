"use client"

import type React from "react"

import { useState } from "react"
import { useMessage } from "@/contexts/message-context"
import { Button } from "@/components/ui/button"
import { Paperclip, Send } from "lucide-react"

export function MessageComposer() {
  const [message, setMessage] = useState("")
  const { sendMessage } = useMessage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessage(message)
      setMessage("")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-950"
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full flex-shrink-0"
          aria-label="Add attachment"
        >
          <Paperclip className="h-5 w-5 text-gray-500" />
          <span className="sr-only">Add attachment</span>
        </Button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 border-none"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 rounded-full flex-shrink-0"
          disabled={!message.trim()}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  )
}
