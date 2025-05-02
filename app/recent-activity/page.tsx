"use client"

import { useState } from "react"
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

// Import the activity-related functions and types from the RecentActivity component
// In a real app, these would be in shared utility files
import {
  getActivityIcon,
  getActivityColor,
  type ActivityItem,
  mockActivities as initialMockActivities,
} from "@/components/dashboard/recent-activity"

// Generate more mock data for demonstration
const generateMoreMockActivities = (): ActivityItem[] => {
  const baseActivities = [...initialMockActivities]
  const types = ["note", "call", "email", "meeting", "document", "estimate", "contract", "sms"]
  const users = ["Mike Johnson", "Lisa Brown", "David Smith", "Emma Wilson", "Robert Taylor"]
  const statuses = ["completed", "pending", "cancelled", undefined]

  // Generate 20 more activities with older timestamps
  for (let i = 0; i < 20; i++) {
    const type = types[Math.floor(Math.random() * types.length)] as ActivityItem["type"]
    const user = users[Math.floor(Math.random() * users.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)] as ActivityItem["status"]
    const daysAgo = Math.floor(Math.random() * 30) + 1 // 1-30 days ago

    baseActivities.push({
      id: `extended-${i}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} activity`,
      description: `This is a mock ${type} activity for demonstration`,
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      user,
      leadId: `lead-${Math.floor(Math.random() * 10) + 1}`,
      status,
    })
  }

  // Sort by timestamp (newest first)
  return baseActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

const mockActivities = generateMoreMockActivities()

export default function RecentActivityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [userFilter, setUserFilter] = useState<string | null>(null)

  // Get unique users for filtering
  const uniqueUsers = Array.from(new Set(mockActivities.map((activity) => activity.user)))

  // Filter activities based on search and filters
  const filteredActivities = mockActivities.filter((activity) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      activity.user.toLowerCase().includes(searchQuery.toLowerCase())

    // Type filter
    const matchesType = typeFilter === null || activity.type === typeFilter

    // Status filter
    const matchesStatus = statusFilter === null || activity.status === statusFilter

    // User filter
    const matchesUser = userFilter === null || activity.user === userFilter

    return matchesSearch && matchesType && matchesStatus && matchesUser
  })

  const clearFilters = () => {
    setTypeFilter(null)
    setStatusFilter(null)
    setUserFilter(null)
  }

  const hasActiveFilters = typeFilter !== null || statusFilter !== null || userFilter !== null

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
                  <DropdownMenuItem onClick={() => setTypeFilter("note")}>Notes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("call")}>Calls</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("email")}>Emails</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("meeting")}>Meetings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("document")}>Documents</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("estimate")}>Estimates</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("contract")}>Contracts</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("sms")}>SMS</DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs">By Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setStatusFilter("completed")}>Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>Cancelled</DropdownMenuItem>
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
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="call">Calls</SelectItem>
                  <SelectItem value="email">Emails</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="estimate">Estimates</SelectItem>
                  <SelectItem value="contract">Contracts</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
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
                Type: {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={() => setTypeFilter(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {statusFilter && (
              <div className="bg-muted px-3 py-1 rounded-full text-xs flex items-center gap-1">
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
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
        {filteredActivities.length > 0 ? (
          <>
            {/* Group activities by date */}
            {groupActivitiesByDate(filteredActivities).map(([dateLabel, activities]) => (
              <div key={dateLabel}>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">{dateLabel}</h2>
                <Card className="overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex gap-3">
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
                              <span className="text-xs text-muted-foreground">
                                {format(activity.timestamp, "h:mm a")}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">by {activity.user}</p>
                          </div>

                          {/* Status if applicable */}
                          {activity.status && (
                            <div className="flex-none">
                              {activity.status === "completed" ? (
                                <div className="flex items-center text-green-500 text-xs">
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span>Complete</span>
                                </div>
                              ) : activity.status === "cancelled" ? (
                                <div className="flex items-center text-red-500 text-xs">
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  <span>Cancelled</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-amber-500 text-xs">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  <span>Pending</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No activities found matching your filters.</p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to group activities by date
function groupActivitiesByDate(activities: ActivityItem[]): [string, ActivityItem[]][] {
  const groups: Record<string, ActivityItem[]> = {}

  activities.forEach((activity) => {
    const date = activity.timestamp
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let dateLabel: string

    if (date.toDateString() === today.toDateString()) {
      dateLabel = "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = "Yesterday"
    } else {
      dateLabel = format(date, "MMMM d, yyyy")
    }

    if (!groups[dateLabel]) {
      groups[dateLabel] = []
    }

    groups[dateLabel].push(activity)
  })

  // Convert to array and sort by date (newest first)
  return Object.entries(groups).sort((a, b) => {
    if (a[0] === "Today") return -1
    if (b[0] === "Today") return 1
    if (a[0] === "Yesterday") return -1
    if (b[0] === "Yesterday") return 1

    const dateA = new Date(a[0])
    const dateB = new Date(b[0])
    return dateB.getTime() - dateA.getTime()
  })
}
