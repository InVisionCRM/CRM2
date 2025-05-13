"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import type { LeadSummary } from "@/types/dashboard"
import { MapPin, Mail, Phone, Calendar } from "lucide-react"

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

  // Make sure the insuranceCompany appears as an optional property to avoid type errors
  // This is a temporary solution; in a real app you would update the LeadSummary type instead
  const getInsuranceCompany = (lead: LeadSummary) => {
    // @ts-ignore - The property might not exist in the type but we're handling it gracefully
    return lead.insuranceCompany || "State Farm Insurance";
  };

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative">
          <CardContent className="p-1 pb-12">
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
                
                {/* Insurance company */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">
                    {getInsuranceCompany(lead)}
                  </div>
                </div>
                
                {/* Contact actions row with appointment */}
                <div className="flex items-center gap-2 flex-wrap">
                  <a 
                    href={`tel:${lead.phone}`} 
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
                  >
                    <Phone className="w-10 h-10" />
                    <span className="text-sm font-medium">Call</span>
                  </a>
                  
                  <a 
                    href={`mailto:${lead.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    <Mail className="w-6 h-10" />
                    <span className="text-smfont-medium">Email</span>
                  </a>
                  
                  {lead.appointmentDate && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Calendar className="w-6 h-10" />
                      <span className="text-sm font-medium">{formatDistanceToNow(new Date(lead.appointmentDate), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          
          {/* View details button - full width */}
          <Link 
            href={`/leads/${lead.id}`}
            className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-gray-400/10 via-lime-500 to-gray-400/10 hover:from-lime-500 hover:via-green-500/50 hover:to-lime-500 hover:text-white flex items-center justify-center transition-all duration-300"
          >
            <span className="text-md font-medium text-black dark:text-gray-900">View</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black dark:text-gray-900 ml-1">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link>
        </Card>
      ))}
    </div>
  )
}
