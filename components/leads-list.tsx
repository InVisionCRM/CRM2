"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow, format } from "date-fns"
import type { LeadSummary } from "@/types/dashboard"
import { MapPin, Mail, Phone, Calendar, User, Clock, Activity } from "lucide-react"

interface LeadsListProps {
  leads: LeadSummary[]
  isLoading?: boolean
  assignedTo?: string | null
}

export function LeadsList({ leads, isLoading = false, assignedTo }: LeadsListProps) {
  if (isLoading) {
    return <p>Loading leads...</p>
  }

  if (leads.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">No leads found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or create a new lead.</p>
      </div>
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "signed_contract":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "colors":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
      case "acv":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "job":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "completed_jobs":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "zero_balance":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "denied":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "follow_ups":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const formatStatusLabel = (status: string): string => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Helper function to get Google Static Maps URL
  const getStaticMapUrl = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=8&size=140x140&markers=color:red%7C${encodedAddress}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  }

  // Helper to get Google Maps URL for navigation
  const getGoogleMapsUrl = (address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  // Helper to get activity badge color based on type
  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "LEAD_CREATED":
        return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
      case "STATUS_CHANGED":
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
      case "NOTE_ADDED":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
      case "MEETING_SCHEDULED":
        return "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
      case "DOCUMENT_UPLOADED":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
      default:
        return "bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  // Helper to format activity type for display
  const formatActivityType = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <Link 
          key={lead.id}
          href={`/leads/${lead.id}`}
          className="block"
        >
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative cursor-pointer">
            <CardContent className="p-1">
              <div className="flex">
                <a 
                  href={getGoogleMapsUrl(lead.address)} 
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-[130px] h-[130px] rounded-md overflow-hidden mr-2 flex-shrink-0 relative group"
                >
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <MapPin className="text-white w-1 h-1" />
                  </div>
                  <Image 
                    src={getStaticMapUrl(lead.address)}
                    alt={`Map for ${lead.address}`}
                    width={130}
                    height={130}
                    className="object-cover"
                  />
                </a>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-md truncate">{lead.name}</h3>
                    <Badge className={`${getStatusBadgeColor(lead.status)} ml-2 flex-shrink-0`}>
                      {formatStatusLabel(lead.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{lead.address}</p>
                  
                  {/* Salesperson and creation date */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded text-violet-700 dark:text-violet-300">
                      <User className="w-3 h-3" />
                      <span>{lead.assignedTo || lead.assignedToId || "Unassigned"}</span>
                    </div>
                    
                    {lead.createdAt && (
                      <div className="flex items-center gap-1 text-xs bg-slate-50 dark:bg-slate-900/20 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(lead.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Latest Activity */}
                  {lead.latestActivity && (
                    <div className="mb-2">
                      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${getActivityBadgeColor(lead.latestActivity.type)}`}>
                        <Activity className="w-3 h-3" />
                        <span className="font-medium">{formatActivityType(lead.latestActivity.type)}:</span>
                        <span className="truncate">{lead.latestActivity.title}</span>
                        <span className="text-xs opacity-70 ml-auto">
                          {formatDistanceToNow(new Date(lead.latestActivity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Contact actions row with appointment */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a 
                      href={`tel:${lead.phone}`} 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors text-xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="font-medium">Call</span>
                    </a>
                    
                    <a 
                      href={`mailto:${lead.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors text-xs"
                    >
                      <Mail className="w-3 h-3" />
                      <span className="font-medium">Email</span>
                    </a>
                    
                    {lead.appointmentDate && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                        <Calendar className="w-3 h-3" />
                        <span className="font-medium">{formatDistanceToNow(new Date(lead.appointmentDate), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
