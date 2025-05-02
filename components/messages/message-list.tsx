"use client"

import { useMessage } from "@/contexts/message-context"
import { MessageItem } from "./message-item"
import { ScrollArea } from "@/components/ui/scroll-area"

export function MessageList() {
  const { messages } = useMessage()

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {messages.length > 0 ? (
          messages.map((message) => <MessageItem key={message.id} message={message} />)
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
