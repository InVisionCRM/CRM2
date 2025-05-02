"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Calendar,
  Clock,
  X,
  MessageCircle,
  FileCheck,
  Calculator,
  ChevronRight,
  MessageSquare,
  UserPlus,
  RefreshCw,
  ClipboardCheck,
  CalendarPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ActivityType } from "@prisma/client"
import type { ActivityWithUser } from "@/lib/db/activities"

export const getActivityIcon = (type: ActivityType) => {
  const icons = {
    LEAD_CREATED: <UserPlus className="h-4 w-4" />,
    LEAD_UPDATED: <RefreshCw className="h-4 w-4" />,
    NOTE_ADDED: <MessageSquare className="h-4 w-4" />,
    MEETING_SCHEDULED: <Calendar className="h-4 w-4" />,
    DOCUMENT_UPLOADED: <FileText className="h-4 w-4" />,
    ESTIMATE_CREATED: <Calculator className="h-4 w-4" />,
    CONTRACT_CREATED: <FileCheck className="h-4 w-4" />,
    STATUS_CHANGED: <ClipboardCheck className="h-4 w-4" />,
    APPOINTMENT_CREATED: <CalendarPlus className="h-4 w-4" />,
    APPOINTMENT_UPDATED: <RefreshCw className="h-4 w-4" />,
  }
  return icons[type] || <MessageSquare className="h-4 w-4" />
}

export const getActivityColor = (type: ActivityType) => {
  const colors = {
    LEAD_CREATED: "bg-purple-100 text-purple-700",
    LEAD_UPDATED: "bg-blue-100 text-blue-700",
    NOTE_ADDED: "bg-blue-100 text-blue-700",
    MEETING_SCHEDULED: "bg-indigo-100 text-indigo-700",
    DOCUMENT_UPLOADED: "bg-green-100 text-green-700",
    ESTIMATE_CREATED: "bg-teal-100 text-teal-700",
    CONTRACT_CREATED: "bg-rose-100 text-rose-700",
    STATUS_CHANGED: "bg-amber-100 text-amber-700",
    APPOINTMENT_CREATED: "bg-sky-100 text-sky-700",
    APPOINTMENT_UPDATED: "bg-cyan-100 text-cyan-700",
  }
  return colors[type] || "bg-gray-100 text-gray-700"
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
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("/api/activities/recent")
        if (!response.ok) {
          throw new Error("Failed to fetch activities")
        }
        const data = await response.json()
        setActivities(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  if (loading) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-none rounded-full bg-muted h-8 w-8" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">Error loading activities: {error}</div>
        </CardContent>
      </Card>
    )
  }

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
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div
                className={cn(
                  "flex-none rounded-full p-2 h-8 w-8 flex items-center justify-center",
                  getActivityColor(activity.type),
                )}
              >
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">{getRelativeTime(activity.createdAt)}</span>
                </div>
                {activity.description && <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">by {activity.userName}</p>
              </div>

              {activity.status && (
                <div className="flex-none">
                  {activity.status === "CANCELLED" ? (
                    <div className="flex items-center text-red-500 text-xs">
                      <X className="h-3.5 w-3.5 mr-1" />
                      <span>Cancelled</span>
                    </div>
                  ) : activity.status === "PENDING" ? (
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
