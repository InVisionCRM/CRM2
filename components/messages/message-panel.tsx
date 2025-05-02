"use client"

import { useMessage } from "@/contexts/message-context"
import { MessageList } from "./message-list"
import { MessageComposer } from "./message-composer"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function MessagePanel() {
  const { isOpen, closeMessagePanel } = useMessage()

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-950 shadow-lg transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Team Messages</h2>
        <Button variant="ghost" size="icon" onClick={closeMessagePanel} aria-label="Close message panel">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList />
        <MessageComposer />
      </div>
    </div>
  )
}
