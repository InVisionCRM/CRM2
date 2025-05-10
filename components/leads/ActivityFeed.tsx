"use client"

import { useState, useEffect } from "react"
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

// Icons for different activity types
const activityIcons: Record<ActivityType, string> = {
  [ActivityType.LEAD_CREATED]: "🆕",
  [ActivityType.LEAD_UPDATED]: "✏️",
  [ActivityType.NOTE_ADDED]: "📝",
  [ActivityType.MEETING_SCHEDULED]: "📅",
  [ActivityType.DOCUMENT_UPLOADED]: "📄",
  [ActivityType.ESTIMATE_CREATED]: "💰",
  [ActivityType.CONTRACT_CREATED]: "📋",
  [ActivityType.STATUS_CHANGED]: "🔄",
  [ActivityType.APPOINTMENT_CREATED]: "📆",
  [ActivityType.APPOINTMENT_UPDATED]: "🕒",
  // Add any other ActivityType members here if they exist
};

export function ActivityFeed({ leadId, limit = 5 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  
  useEffect(() => {
    async function fetchActivities() {
      if (!leadId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace with your actual API endpoint for fetching activities
        // Example: const response = await fetch(`/api/leads/${leadId}/activities`);
        // if (!response.ok) throw new Error("Failed to load activities");
        // const data = await response.json();
        // setActivities(data);

        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const mockActivitiesData: ActivityWithUser[] = [
          {
            id: "activity1", type: ActivityType.STATUS_CHANGED, title: "Status changed to Scheduled",
            description: "Lead moved to scheduled state by system.", userId: "system", leadId,
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), updatedAt: new Date(), status: null,
            user: { name: "System Process", image: null }
          },
          {
            id: "activity2", type: ActivityType.NOTE_ADDED, title: "Note added by Jane",
            description: "Customer expressed interest in premium roofing materials.", userId: "user123", leadId,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), updatedAt: new Date(), status: null,
            user: { name: "Jane Doe", image: "/avatars/jane.png" }
          },
          {
            id: "activity3", type: ActivityType.DOCUMENT_UPLOADED, title: "Contract uploaded",
            description: "Signed_Contract_Lead123.pdf", userId: "user456", leadId,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), updatedAt: new Date(), status: null,
            user: { name: "Admin User", image: null }
          },
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(mockActivitiesData);

      } catch (err) {
        console.error("Error fetching activities:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchActivities();
  }, [leadId]);
  
  const displayActivities = showAll ? activities : activities.slice(0, limit);

  if (isLoading) {
    return <ActivityFeedSkeleton />;
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent><p className="text-destructive text-center py-4">Error: {error}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No activity recorded for this lead yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="relative pl-8 space-y-6 py-2">
              {/* Timeline connector line */}
              <div className="absolute top-0 bottom-0 left-3.5 w-0.5 bg-border rounded-full" />
              
              {displayActivities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-3">
                  {/* Timeline dot with icon */}
                  <div className="absolute -left-[1px] mt-1 h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center shadow">
                    <span className="text-sm" title={activity.type}>{activityIcons[activity.type] || "📌"}</span>
                  </div>
                  
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-card-foreground">{activity.title}</span>
                      <span className="text-xs text-muted-foreground" title={new Date(activity.createdAt).toLocaleString()}>
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {activity.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
                    )}
                    
                    {activity.user && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
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
                </div>
              ))}
            </div>
            
            {activities.length > limit && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowAll(!showAll)}
              >
                <span>{showAll ? "Show Less" : "Show More Activity"}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAll && "rotate-180")} />
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
      <CardContent className="pt-4 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" /> {/* Skeleton for icon dot */}
            <div className="flex-grow space-y-2">
              <Skeleton className="h-5 w-3/4" /> {/* Skeleton for title */}
              <Skeleton className="h-4 w-full" /> {/* Skeleton for description */}
              <Skeleton className="h-3 w-1/3" /> {/* Skeleton for user/timestamp */}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 