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
import { formatStatusLabel } from "@/lib/utils"

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
  
  return <span className="font-medium text-card-foreground">{activity.title}</span>
}

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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 20

  const fetchActivities = async (pageNum: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/activities?page=${pageNum}&limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`)
      }
      
      const data = await response.json()
      setActivities(data.items)
      setTotalPages(Math.ceil(data.total / limit))
      
    } catch (err) {
      console.error("Error fetching activities:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchActivities(currentPage)
  }, [currentPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Show max 5 page numbers at a time

    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of page numbers to show
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the start or end
      if (currentPage <= 2) {
        end = 4
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3
      }

      // Add ellipsis if needed
      if (start > 2) {
        pageNumbers.push('...')
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pageNumbers.push('...')
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

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
            onClick={() => fetchActivities(currentPage)}
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
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Activities</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => fetchActivities(currentPage)} 
          className="h-8 px-2"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-center py-2">No activities recorded yet.</p>
        ) : (
          <>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border-b border-border/40 pb-3 last:pb-0">
                  <div className="flex items-center justify-between text-sm">
                    <ActivityContent activity={activity} />
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2">...</span>
                  ) : (
                    <PaginationButton
                      key={pageNum}
                      page={pageNum as number}
                      currentPage={currentPage}
                      onClick={handlePageChange}
                    />
                  )
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
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