"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, Filter, Check, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import the activity-related functions from the RecentActivity component
import {
  getActivityIcon,
  getActivityColor,
  getRelativeTime,
} from "@/components/dashboard/recent-activity"
import type { ActivityWithUser } from "@/lib/db/activities"

// Define the activity item type based on what we expect from the API
type ActivityItem = ActivityWithUser & {
  timestamp?: Date; // For backward compatibility with existing code
}

export default function RecentActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<string | null>(null)

  // Fetch activities from the API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch("/api/activities/all")
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

  // Get unique users for filtering
  const uniqueUsers = Array.from(new Set(activities.map((activity) => activity.userName || "")))

  // Filter activities based on search and filters
  const filteredActivities = activities.filter((activity) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (activity.userName && activity.userName.toLowerCase().includes(searchQuery.toLowerCase()))

    // Type filter
    const matchesType = typeFilter === null || activity.type === typeFilter

    // Status filter
    const matchesStatus = statusFilter === null || activity.status === statusFilter

    // User filter
    const matchesUser = userFilter === null || activity.userName === userFilter

    return matchesSearch && matchesType && matchesStatus && matchesUser
  })

  const clearFilters = () => {
    setTypeFilter(null)
    setStatusFilter(null)
    setUserFilter(null)
  }

  const hasActiveFilters = typeFilter !== null || statusFilter !== null || userFilter !== null

  if (loading) {
    return (
      <div className="container px-4 py-4 mx-auto max-w-7xl">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Recent Activity</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <div className="flex-none rounded-full bg-muted h-8 w-8" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container px-4 py-4 mx-auto max-w-7xl">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Recent Activity</h1>
        </div>
        <Card className="p-4">
          <div className="text-center text-red-500">
            <p>Error loading activities: {error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container px-4 py-4 mx-auto max-w-7xl">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Dashboard</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Recent Activity</h1>
      </div>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                  {hasActiveFilters && (
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      !
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter Activities</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">By Type</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTypeFilter("NOTE_ADDED")}>Notes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("LEAD_CREATED")}>Lead Created</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("LEAD_UPDATED")}>Lead Updated</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("MEETING_SCHEDULED")}>Meetings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("DOCUMENT_UPLOADED")}>Documents</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("ESTIMATE_CREATED")}>Estimates</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("CONTRACT_CREATED")}>Contracts</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("STATUS_CHANGED")}>Status Changed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("APPOINTMENT_CREATED")}>Appointment Created</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("APPOINTMENT_UPDATED")}>Appointment Updated</DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">By Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setStatusFilter("COMPLETED")}>Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("CANCELLED")}>Cancelled</DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">By User</DropdownMenuLabel>
                  {uniqueUsers.map((user) => (
                    <DropdownMenuItem key={user} onClick={() => setUserFilter(user)}>
                      {user}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={clearFilters} className="text-primary">
                  Clear All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select
              value={typeFilter || "all"}
              onValueChange={(value) => setTypeFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Activity Type</SelectLabel>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="NOTE_ADDED">Notes</SelectItem>
                  <SelectItem value="LEAD_CREATED">Lead Created</SelectItem>
                  <SelectItem value="LEAD_UPDATED">Lead Updated</SelectItem>
                  <SelectItem value="MEETING_SCHEDULED">Meetings</SelectItem>
                  <SelectItem value="DOCUMENT_UPLOADED">Documents</SelectItem>
                  <SelectItem value="ESTIMATE_CREATED">Estimates</SelectItem>
                  <SelectItem value="CONTRACT_CREATED">Contracts</SelectItem>
                  <SelectItem value="STATUS_CHANGED">Status Changed</SelectItem>
                  <SelectItem value="APPOINTMENT_CREATED">Appointment Created</SelectItem>
                  <SelectItem value="APPOINTMENT_UPDATED">Appointment Updated</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {typeFilter && (
              <div className="bg-muted px-3 py-1 rounded-full text-xs flex items-center gap-1">
                Type: {typeFilter.replace(/_/g, ' ')}
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={() => setTypeFilter(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {statusFilter && (
              <div className="bg-muted px-3 py-1 rounded-full text-xs flex items-center gap-1">
                Status: {statusFilter}
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={() => setStatusFilter(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {userFilter && (
              <div className="bg-muted px-3 py-1 rounded-full text-xs flex items-center gap-1">
                User: {userFilter}
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={() => setUserFilter(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Activity list */}
      <div className="space-y-4">
        {groupActivitiesByDate(filteredActivities).map(([date, dateActivities]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
            {dateActivities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "flex-none rounded-full p-2 h-8 w-8 flex items-center justify-center",
                      getActivityColor(activity.type)
                    )}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(activity.createdAt || activity.timestamp!)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                    )}
                    {activity.userName && (
                      <p className="text-xs text-muted-foreground mt-0.5">by {activity.userName}</p>
                    )}
                    {activity.leadId && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Link href={`/leads/${activity.leadId}`} className="text-primary hover:underline">
                          View Lead
                        </Link>
                      </p>
                    )}
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
                      ) : activity.status === "COMPLETED" ? (
                        <div className="flex items-center text-green-500 text-xs">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          <span>Completed</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ))}

        {filteredActivities.length === 0 && (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <p>No activities found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search criteria</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Helper to group activities by date
function groupActivitiesByDate(activities: ActivityItem[]): [string, ActivityItem[]][] {
  const grouped = new Map<string, ActivityItem[]>()

  activities.forEach((activity) => {
    const date = activity.createdAt || activity.timestamp!
    const dateString = format(date, "MMMM d, yyyy")
    
    if (!grouped.has(dateString)) {
      grouped.set(dateString, [])
    }
    
    grouped.get(dateString)!.push(activity)
  })

  // Sort dates in descending order (newest first)
  return Array.from(grouped.entries()).sort((a, b) => {
    const dateA = new Date(a[0])
    const dateB = new Date(b[0])
    return dateB.getTime() - dateA.getTime()
  })
}
