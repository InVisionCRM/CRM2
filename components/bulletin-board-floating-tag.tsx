"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BulletinBoardFloatingTagProps {
  onOpen: () => void
  className?: string
  unreadCount?: number
}

export function BulletinBoardFloatingTag({ onOpen, className, unreadCount = 0 }: BulletinBoardFloatingTagProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed right-4 bottom-20 sm:bottom-4 z-50 transition-all duration-300 ease-in-out",
      className
    )}>
      <div className="flex flex-col items-end gap-2">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 p-0 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border shadow-lg hover:bg-white dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* Bulletin board button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button
                  onClick={onOpen}
                  className={cn(
                    "h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group",
                    unreadCount > 0 && "animate-pulse"
                  )}
                >
                  <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                </Button>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center p-0 min-w-0 animate-bounce">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Open Bulletin Board</p>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
} 