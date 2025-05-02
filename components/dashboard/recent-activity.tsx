"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Calendar,
  Clock,
  X,
  Phone,
  MessageCircle,
  FileCheck,
  Calculator,
  Pencil,
  ChevronRight,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Add export to the ActivityItem interface and mock data
export interface ActivityItem {
  id: string
  type: "note" | "call" | "email" | "meeting" | "document" | "estimate" | "contract" | "sms"
  title: string
  description?: string
  timestamp: Date
  user: string
  leadId?: string
  status?: "completed" | "pending" | "cancelled"
}

// Export mock data
export const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "note",
    title: "Added note to John Smith",
    description: "Customer called about hail damage to their roof.",
    timestamp: new Date(Date.now() - 30 * 60000), // 30 mins ago
    user: "Mike Johnson",
    leadId: "1",
  },
  {
    id: "2",
    type: "meeting",
    title: "Completed site measurement",
    description: "Sarah Johnson property",
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    user: "Mike Johnson",
    leadId: "2",
    status: "completed",
  },
  {
    id: "3",
    type: "document",
    title: "Uploaded roof photos",
    description: "New damage photos for Michael Brown",
    timestamp: new Date(Date.now() - 3 * 60 * 60000), // 3 hours ago
    user: "Lisa Brown",
    leadId: "3",
  },
  {
    id: "4",
    type: "estimate",
    title: "Created new estimate",
    description: "Emily Davis project",
    timestamp: new Date(Date.now() - 5 * 60 * 60000), // 5 hours ago
    user: "Mike Johnson",
    leadId: "4",
  },
  {
    id: "5",
    type: "call",
    title: "Call with Robert Wilson",
    description: "Discussed proposal and pricing",
    timestamp: new Date(Date.now() - 24 * 60 * 60000), // 1 day ago
    user: "Lisa Brown",
    leadId: "5",
  },
]

// Export the helper functions
export const getActivityIcon = (type: string) => {
  const icons = {
    note: <MessageSquare className="h-4 w-4" />,
    call: <Phone className="h-4 w-4" />,
    email: <MessageCircle className="h-4 w-4" />,
    meeting: <Calendar className="h-4 w-4" />,
    document: <FileText className="h-4 w-4" />,
    estimate: <Calculator className="h-4 w-4" />,
    contract: <FileCheck className="h-4 w-4" />,
    sms: <MessageCircle className="h-4 w-4" />,
  }
  return icons[type as keyof typeof icons] || <Pencil className="h-4 w-4" />
}

export const getActivityColor = (type: string) => {
  const colors = {
    note: "bg-blue-100 text-blue-700",
    call: "bg-purple-100 text-purple-700",
    email: "bg-amber-100 text-amber-700",
    meeting: "bg-indigo-100 text-indigo-700",
    document: "bg-green-100 text-green-700",
    estimate: "bg-teal-100 text-teal-700",
    contract: "bg-rose-100 text-rose-700",
    sms: "bg-sky-100 text-sky-700",
  }
  return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700"
}

export const getRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffHrs < 24) {
    return `${diffHrs}h ago`
  } else if (diffDays === 1) {
    return `Yesterday`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return format(date, "MMM d")
  }
}

export function RecentActivity() {
  const router = useRouter()
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => router.push("/recent-activity")}>
          <span className="text-xs">View All</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              {/* Icon */}
              <div
                className={cn(
                  "flex-none rounded-full p-2 h-8 w-8 flex items-center justify-center",
                  getActivityColor(activity.type),
                )}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">{getRelativeTime(activity.timestamp)}</span>
                </div>
                {activity.description && <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">by {activity.user}</p>
              </div>

              {/* Status if applicable */}
              {activity.status && (
                <div className="flex-none">
                  {activity.status === "cancelled" ? (
                    <div className="flex items-center text-red-500 text-xs">
                      <X className="h-3.5 w-3.5 mr-1" />
                      <span>Cancelled</span>
                    </div>
                  ) : activity.status === "pending" ? (
                    <div className="flex items-center text-amber-500 text-xs">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>Pending</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
