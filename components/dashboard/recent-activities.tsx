"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { ActivityType, LeadStatus } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, RefreshCw, ExternalLink, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatStatusLabel, cn, getActivityColorClasses } from "@/lib/utils"

// Helper function to extract status from title and description
function extractStatusFromTitle(title: string, description: string | null): { oldStatus: LeadStatus | null, newStatus: LeadStatus | null } {
  // Try to extract from description first
  if (description) {
    const descMatch = description.match(/Lead status changed from (.*?) to (.*)/)
    if (descMatch) {
      const oldStatusLabel = descMatch[1]
      const newStatusLabel = descMatch[2]
      
      // Convert status labels back to enum values
      const oldStatus = Object.values(LeadStatus).find(
        status => formatStatusLabel(status).toLowerCase() === oldStatusLabel.toLowerCase()
      ) || null
      
      const newStatus = Object.values(LeadStatus).find(
        status => formatStatusLabel(status).toLowerCase() === newStatusLabel.toLowerCase()
      ) || null

      return { oldStatus, newStatus }
    }
  }
  
  // Fallback to title
  const titleMatch = title.match(/Status changed to (.*)/)
  if (titleMatch) {
    const newStatusLabel = titleMatch[1]
    const newStatus = Object.values(LeadStatus).find(
      status => formatStatusLabel(status).toLowerCase() === newStatusLabel.toLowerCase()
    ) || null
    
    return { 
      oldStatus: null,
      newStatus
    }
  }

  return { oldStatus: null, newStatus: null }
}

interface ActivityWithUser {
  id: string
  type: ActivityType
  title: string
  description: string | null
  userId: string
  leadId: string | null
  leadName?: string | null
  createdAt: Date
  updatedAt: Date
  userName?: string
  user?: {
    name?: string | null
    image?: string | null
  } | null
}

function ActivityContent({ activity }: { activity: ActivityWithUser }) {
  if (activity.type === ActivityType.STATUS_CHANGED) {
    const { oldStatus, newStatus } = extractStatusFromTitle(activity.title, activity.description)
    if (newStatus) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          {oldStatus && (
            <>
              <Badge variant={oldStatus}>{formatStatusLabel(oldStatus)}</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          <Badge variant={newStatus}>{formatStatusLabel(newStatus)}</Badge>
        </div>
      )
    }
  }
  
  // For non-status change activities, show the title
  return <span className="font-medium text-card-foreground">{activity.title}</span>
}

function PaginationButton({ 
  page, 
  currentPage, 
  onClick 
}: { 
  page: number, 
  currentPage: number, 
  onClick: (page: number) => void 
}) {
  return (
    <Button
      variant={page === currentPage ? "default" : "outline"}
      size="sm"
      className={`w-8 h-8 p-0 ${page === currentPage ? 'bg-primary text-primary-foreground' : ''}`}
      onClick={() => onClick(page)}
    >
      {page}
    </Button>
  )
}

export function RecentActivities() {
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const limit = 25 // Show up to 25 activities in the scrollable container

  const fetchActivities = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/activities?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`)
      }
      
      const data = await response.json()
      setActivities(data.items.slice(0, limit))
      
    } catch (err) {
      console.error("Error fetching activities:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchActivities()
  }, [])

  if (isLoading && activities.length === 0) {
    return <ActivityFeedSkeleton />
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-lg">Recent Activities</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchActivities}
            className="h-8 px-2 text-xs"
          >
            Retry
          </Button>
        </CardHeader>
        <CardContent><p className="text-destructive text-xs text-center py-4">Error: {error}</p></CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Recent Activities
          {activities.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({activities.length} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-2">No activities recorded yet.</p>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto pb-4 -mx-6">
              <div className="flex gap-4 px-6 min-w-full w-max">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={cn(
                      "w-[350px] shrink-0 border border-border/40 rounded-lg p-4",
                      getActivityColorClasses(activity.type)
                    )}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <ActivityContent activity={activity} />
                      <span className="text-xs text-muted-foreground" title={new Date(activity.createdAt).toLocaleString()}>
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {activity.leadName && (
                      <div className="mt-2 text-sm font-medium">
                        {activity.leadName}
                      </div>
                    )}

                        {activity.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">{activity.description}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          {(activity.user || activity.userName) && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Avatar className="h-4 w-4">
                                {activity.user?.image && <AvatarImage src={activity.user.image} alt={activity.user?.name || activity.userName || 'User'} />}
                                <AvatarFallback className="text-[8px]">
                                  {activity.user?.name ? activity.user.name.substring(0,1).toUpperCase() :
                                   activity.userName ? activity.userName.substring(0,1).toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span>{activity.user?.name || activity.userName || 'Unknown User'}</span>
                            </div>
                          )}

                          {activity.leadId && (
                            <Link
                              href={`/leads/${activity.leadId}`}
                              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                          <span>View Details</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityFeedSkeleton() {
  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3 border-b">
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex gap-4 overflow-x-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[350px] shrink-0 border border-border/40 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 