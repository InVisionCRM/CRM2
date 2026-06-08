"use client"

import type React from "react"
import { format, parseISO, isValid } from "date-fns"
import { Calendar, Clock, MapPin, FileText } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface EventTooltipProps {
  event: any
  children: React.ReactNode
}

export function EventTooltip({ event, children }: EventTooltipProps) {
  // Parse dates
  const startDate = event.start?.dateTime
    ? parseISO(event.start.dateTime)
    : event.start?.date
      ? parseISO(event.start.date)
      : null

  const endDate = event.end?.dateTime ? parseISO(event.end.dateTime) : event.end?.date ? parseISO(event.end.date) : null

  const isAllDay = !event.start?.dateTime

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        className="w-64 p-4 space-y-2 bg-[#161D18] border border-[#ECEAE0]/[0.08] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)] rounded-xl text-[#ECEAE0]"
        side="right"
        sideOffset={5}
        asChild
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="font-semibold text-base tracking-tight text-[#ECEAE0]">{event.summary || "Untitled Event"}</div>

          <div className="flex items-start text-xs text-[#A7B0A6]">
            <Calendar className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-[#6E776E]" strokeWidth={2} />
            <div>
              {startDate && isValid(startDate) ? (
                <>
                  {format(startDate, "EEEE, MMMM d, yyyy")}
                  {isAllDay && " (All day)"}
                </>
              ) : (
                "Date not available"
              )}
            </div>
          </div>

          {!isAllDay && startDate && endDate && isValid(startDate) && isValid(endDate) && (
            <div className="flex items-start text-xs text-[#A7B0A6]">
              <Clock className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-[#6E776E]" strokeWidth={2} />
              <div>
                {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
              </div>
            </div>
          )}

          {event.location && (
            <div className="flex items-start text-xs text-[#A7B0A6]">
              <MapPin className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-[#6E776E]" strokeWidth={2} />
              <div>{event.location}</div>
            </div>
          )}

          {event.description && (
            <div className="flex items-start text-xs text-[#A7B0A6]">
              <FileText className="h-3.5 w-3.5 mr-2 mt-0.5 flex-shrink-0 text-[#6E776E]" strokeWidth={2} />
              <div className="line-clamp-3">{event.description}</div>
            </div>
          )}
        </motion.div>
      </TooltipContent>
    </Tooltip>
  )
}
