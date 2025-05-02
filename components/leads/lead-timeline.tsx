"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Calendar, Phone, Mail, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string | number
  type: "note" | "appointment" | "call" | "email" | "status"
  title: string
  description: string
  date: string
  icon?: any
}

interface LeadTimelineProps {
  leadId: string
}

export function LeadTimeline({ leadId }: LeadTimelineProps) {
  const [timelineItems] = useState<TimelineItem[]>([
    {
      id: 1,
      type: "note",
      icon: FileText,
      title: "Note Added",
      description: "Initial contact made with customer",
      date: "2024-03-20",
    },
    {
      id: 2,
      type: "appointment",
      icon: Calendar,
      title: "Appointment Scheduled",
      description: "Site inspection scheduled",
      date: "2024-03-22",
    },
    {
      id: 3,
      type: "call",
      icon: Phone,
      title: "Phone Call",
      description: "Discussed project details",
      date: "2024-03-23",
    },
    {
      id: 4,
      type: "email",
      icon: Mail,
      title: "Email Sent",
      description: "Sent quote and contract",
      date: "2024-03-24",
    },
  ])

  const getIconColor = (type: TimelineItem["type"]) => {
    switch (type) {
      case "note":
        return "text-blue-500"
      case "appointment":
        return "text-green-500"
      case "call":
        return "text-purple-500"
      case "email":
        return "text-orange-500"
      case "status":
        return "text-gray-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-8">
          {timelineItems.map((item, index) => {
            const Icon = item.icon || Clock
            return (
              <div key={item.id} className="relative pl-8">
                {index !== timelineItems.length - 1 && (
                  <div className="absolute left-[11px] top-[24px] h-full w-px bg-border" />
                )}
                <div className="flex items-start">
                  <div
                    className={cn(
                      "absolute left-0 rounded-full p-1 ring-2 ring-background",
                      getIconColor(item.type),
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 