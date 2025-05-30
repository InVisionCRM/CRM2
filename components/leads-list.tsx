"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow, format } from "date-fns"
import type { LeadSummary } from "@/types/dashboard"
import { MapPin, Mail, Phone, Calendar, User, Clock, Activity, Eye, ListChecks, Folder, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { LeadStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"

interface LeadsListProps {
  leads: LeadSummary[]
  isLoading?: boolean
  assignedTo?: string | null
  onViewActivity: (lead: LeadSummary) => void
  onViewFiles: (lead: LeadSummary) => void
}

// Helper function for string truncation
const truncateString = (str: string | null | undefined, num: number): string => {
  if (!str) return "N/A";
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + "...";
};

const getStatusColorClasses = (status: LeadStatus | undefined): string => {
  if (!status) return "bg-gray-200 text-gray-700"
  switch (status) {
    case LeadStatus.signed_contract:
      return "bg-sky-100 text-sky-700 border border-sky-300"
    case LeadStatus.scheduled:
      return "bg-blue-100 text-blue-700 border border-blue-300"
    case LeadStatus.colors:
      return "bg-indigo-100 text-indigo-700 border border-indigo-300"
    case LeadStatus.acv:
      return "bg-purple-100 text-purple-700 border border-purple-300"
    case LeadStatus.job:
      return "bg-amber-100 text-amber-700 border border-amber-300"
    case LeadStatus.completed_jobs:
      return "bg-emerald-100 text-emerald-700 border border-emerald-300"
    case LeadStatus.zero_balance:
      return "bg-green-100 text-green-700 border border-green-300"
    case LeadStatus.denied:
      return "bg-red-100 text-red-700 border border-red-300"
    case LeadStatus.follow_ups:
      return "bg-yellow-100 text-yellow-700 border border-yellow-300"
    default:
      return "bg-gray-100 text-gray-600 border border-gray-300"
  }
}

// Helper to get Google Maps URL for navigation
const getGoogleMapsUrl = (address: string | null | undefined) => {
  if (!address) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function LeadsList({ leads, isLoading = false, assignedTo, onViewActivity, onViewFiles }: LeadsListProps) {
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
    <div className="overflow-x-auto relative border rounded-lg shadow-sm bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-200 sticky top-0 z-10">
          <tr>
            <th
              scope="col"
              className="px-1 py-1 text-left text-md font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap sm:min-w-[200px]"
            >
              Actions
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Claim #
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Address
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
              Assigned To
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900" title={lead.name || "N/A"}>
                  {truncateString(lead.name, 17)}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link href={`/leads/${lead.id}`} passHref legacyBehavior>
                    <Button asChild variant="outline" size="sm" title="View Lead" className="text-lime-700 bg-white border-lime-500 hover:text-lime-600 hover:bg-white hover:border-lime-300 h-9 px-2 sm:px-3">
                      <a>
                        <Eye className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">View</span>
                      </a>
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" title="View Activity" onClick={() => onViewActivity(lead)} className="text-blue-500 bg-white border-blue-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-300 h-9 px-2 sm:px-3">
                    <ListChecks className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Activity</span>
                  </Button>
                  <Button variant="outline" size="sm" title="View Files" onClick={() => onViewFiles(lead)} className="text-red-700 bg-white border-red-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-300 h-9 px-2 sm:px-3">
                    <Folder className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Files</span>
                  </Button>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={cn(
                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                    getStatusColorClasses(lead.status)
                  )}
                >
                  {lead.status ? lead.status.replace(/_/g, ' ') : "Unknown"}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {lead.claimNumber || "N/A"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center space-x-1 text-md text-gray-700">
                  <span title={lead.address || "N/A"}>{truncateString(lead.address, 20)}</span>
                  {lead.address && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Open in Google Maps" 
                      onClick={() => window.open(getGoogleMapsUrl(lead.address), "_blank", "noopener,noreferrer")}
                      className="h-7 w-7 text-green-600 hover:text-blue-600 hover:bg-gray-100 rounded" 
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                {lead.assignedTo || "Unassigned"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
