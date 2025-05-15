"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { ActivityType } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, RefreshCw, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getRecentActivities } from "@/lib/db/activities"

interface ActivityWithUser {
  id: string
  type: ActivityType
  title: string
  description: string | null
  userId: string
  leadId: string | null
  createdAt: Date
  updatedAt: Date
  userName?: string
  leadName?: string
  user?: {
    name?: string | null
    image?: string | null
  } | null
}

export function RecentActivities() {
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const limit = 5

  const fetchActivities = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/activities')
      
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`)
      }
      
      const data = await response.json()
      setActivities(data)
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

  if (isLoading) {
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

  const displayActivities = showAll ? activities : activities.slice(0, limit)

  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Activities</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchActivities} 
          className="h-8 px-2"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-2">No activities recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="border-b border-border/40 pb-3 last:pb-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-card-foreground">{activity.title}</span>
                  <span className="text-xs text-muted-foreground" title={new Date(activity.createdAt).toLocaleString()}>
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {activity.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{activity.description}</p>
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
                      <span>View {activity.leadName || 'Lead'}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            
            {activities.length > limit && !showAll && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAll(true)}
              >
                <span>Show More</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            
            {showAll && activities.length > limit && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAll(false)}
              >
                <span>Show Less</span>
                <ChevronDown className="h-4 w-4 rotate-180" />
              </Button>
            )}
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
      <CardContent className="pt-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 