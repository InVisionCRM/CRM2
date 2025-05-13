"use client"

import { useState, useEffect, useCallback } from "react"
import { formatDistanceToNow } from "date-fns"
import { ActivityType, type Activity as PrismaActivity } from "@prisma/client" // Use PrismaActivity type
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ActivityFeedProps {
  leadId: string
  limit?: number
}

// Extend PrismaActivity to include optional user details for display
interface ActivityWithUser extends PrismaActivity {
  user?: { // User is optional if not always fetched or available
    name?: string | null;
    image?: string | null;
  } | null;
}

export function ActivityFeed({ leadId, limit = 5 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [refreshActivities, setRefreshActivities] = useState(0)
  
  const fetchActivities = useCallback(async () => {
    if (!leadId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leads/${leadId}/activities${
        showAll ? '' : `?limit=${limit}`
      }`);
      
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
      
      const data: ActivityWithUser[] = await response.json();
      setActivities(data);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [leadId, limit, showAll]);
  
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);
  
  const displayActivities = activities;

  if (isLoading) {
    return <ActivityFeedSkeleton />;
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchActivities}
            className="h-8 px-2 text-xs"
          >
            Retry
          </Button>
        </CardHeader>
        <CardContent><p className="text-destructive text-center py-4">Error: {error}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchActivities} 
          className="h-8 px-2"
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No activity recorded for this lead yet.</p>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-card-foreground">{activity.title}</span>
                  <span className="text-xs text-muted-foreground" title={new Date(activity.createdAt).toLocaleString()}>
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {activity.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{activity.description}</p>
                )}
                
                {activity.user && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Avatar className="h-4 w-4">
                      {activity.user.image && <AvatarImage src={activity.user.image} alt={activity.user.name || 'User'} />}
                      <AvatarFallback className="text-[8px]">
                        {activity.user.name ? activity.user.name.substring(0,1).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{activity.user.name || 'Unknown User'}</span>
                  </div>
                )}
              </div>
            ))}
            
            {activities.length >= limit && !showAll && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAll(true)}
              >
                <span>Show More Activity</span>
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
  );
}

function ActivityFeedSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <Skeleton className="h-6 w-36" /> {/* Skeleton for CardTitle */}
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-3/4" /> {/* Skeleton for title */}
              <Skeleton className="h-4 w-16" /> {/* Skeleton for timestamp */}
            </div>
            <Skeleton className="h-4 w-full" /> {/* Skeleton for description */}
            <div className="flex items-center gap-1.5 mt-2">
              <Skeleton className="h-4 w-4 rounded-full" /> {/* Skeleton for avatar */}
              <Skeleton className="h-3 w-24" /> {/* Skeleton for username */}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 