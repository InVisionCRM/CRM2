"use client"

import type { Message } from "@/types/message"
import { formatDistanceToNow } from "date-fns"
import { useMessage } from "@/contexts/message-context"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const { markAsRead } = useMessage()

  const handleClick = () => {
    if (!message.isRead) {
      markAsRead(message.id)
    }
  }

  return (
    <div
      className={cn(
        "p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
        !message.isRead && "bg-blue-50 dark:bg-blue-900/20",
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {message.authorAvatar ? (
            <div className="h-8 w-8 rounded-full overflow-hidden">
              <Image
                src={message.authorAvatar || "/placeholder.svg"}
                alt={message.authorName}
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {message.authorName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={cn("text-sm font-medium truncate", !message.isRead && "font-semibold")}>
              {message.authorName}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p
            className={cn(
              "text-sm text-gray-600 dark:text-gray-300 line-clamp-2",
              !message.isRead && "font-medium text-gray-900 dark:text-gray-100",
            )}
          >
            {message.content}
          </p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {message.attachments.length} attachment{message.attachments.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
