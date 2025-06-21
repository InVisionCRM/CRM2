"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LeadStatus } from "@prisma/client"
import { formatStatusLabel } from "@/lib/utils"

// Status color mapping
const statusColors = {
  follow_ups: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  scheduled: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  completed_jobs: "bg-green-500/20 text-green-500 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-500 border-gray-500/30",
  contract_sent: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  contract_signed: "bg-indigo-500/20 text-indigo-500 border-indigo-500/30",
  in_progress: "bg-orange-500/20 text-orange-500 border-orange-500/30"
} as const

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  status: LeadStatus
  createdAt: Date
  updatedAt: Date
  address: string | null
}

export function MyLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const limit = 25 // Show up to 25 leads in the scrollable container

  const getStreetViewUrl = (address: string) => {
    return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
  }

  const getStatusColor = (status: LeadStatus) => {
    return statusColors[status] || "bg-gray-500/20 text-gray-500 border-gray-500/30"
  }

  const fetchLeads = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/leads")
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched leads data:", data)
        setLeads(data)
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  if (isLoading) {
    return <LeadsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-lg">My Leads</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeads}
            className="h-8 px-2 text-xs"
          >
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-xs text-center py-4">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          My Leads
          {leads.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({leads.length} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {leads.length === 0 ? (
          <p className="text-muted-foreground text-center py-2">No leads found.</p>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto pb-4 -mx-6">
              <div className="flex gap-4 px-6 min-w-full w-max">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={cn(
                      "w-[300px] h-[200px] shrink-0 border border-border/40 rounded-lg overflow-hidden relative group",
                      "border-l-4 border-l-blue-200 hover:shadow-lg transition-all duration-200"
                    )}
                  >
                    {/* Street View Background */}
                    {lead.address && (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={getStreetViewUrl(lead.address)}
                          alt={`Street view of ${lead.address}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[2px] transition-all duration-300 group-hover:backdrop-blur-none">
                      {/* Main Content - Slides up on hover */}
                      <div className="absolute inset-0 p-4 flex flex-col transition-transform duration-300 group-hover:-translate-y-full">
                        <div className="flex-1">
                          <h3 className="font-medium text-white truncate">
                            {lead.firstName} {lead.lastName}
                          </h3>
                          {lead.address && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-gray-300 flex-shrink-0" />
                              <p className="text-sm text-gray-300 line-clamp-2">
                                {lead.address}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "transition-colors",
                              getStatusColor(lead.status)
                            )}
                          >
                        {formatStatusLabel(lead.status)}
                      </Badge>
                          <div className="rounded-full p-2 bg-blue-500/10">
                            <ArrowUpRight className="h-5 w-5 text-blue-400" />
                          </div>
                        </div>
                      </div>

                      {/* "Click to View" text - Slides up from bottom on hover */}
                      <div className="absolute inset-x-0 bottom-0 h-16 flex items-center justify-center bg-gradient-to-t from-black/80 to-transparent translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                        <p className="text-white font-medium">Click to View</p>
                      </div>
                    </div>

                    {/* Clickable Link - Covers entire card */}
                    <Link
                      href={`/leads/${lead.id}`}
                      className="absolute inset-0 z-20"
                    >
                      <span className="sr-only">View lead details</span>
                    </Link>
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

function LeadsSkeleton() {
  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3 border-b">
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex gap-4 overflow-x-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[300px] h-[200px] shrink-0 border border-border/40 rounded-lg p-4 bg-black/10">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-5 w-16" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 