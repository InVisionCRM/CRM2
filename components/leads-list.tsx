"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow, format } from "date-fns"
import type { LeadSummary } from "@/types/dashboard"
import { MapPin, Mail, Phone, Calendar, User, Clock, Activity, Eye, ListChecks, Folder, MoreHorizontal, ChevronRight, Plus, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { LeadStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { InlineEditDialog } from "@/components/leads/inline-edit-dialog"
import { StreetViewTooltip } from "@/components/leads/street-view-tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

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
const getGoogleMapsUrl = (address: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Helper to format dates consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
};

export function LeadsList({ leads, isLoading = false, assignedTo, onViewActivity, onViewFiles }: LeadsListProps) {
  const [editDialogState, setEditDialogState] = useState<{
    isOpen: boolean;
    leadId: string;
    field: "claimNumber" | "address" | "insuranceCompany";
  }>({
    isOpen: false,
    leadId: "",
    field: "claimNumber"
  });

  const handleOpenEditDialog = (leadId: string, field: "claimNumber" | "address" | "insuranceCompany") => {
    setEditDialogState({
      isOpen: true,
      leadId,
      field
    });
  };

  const handleCloseEditDialog = () => {
    setEditDialogState(prev => ({ ...prev, isOpen: false }));
  };

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

  return (
    <div className="overflow-x-auto relative border rounded-lg shadow-sm bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 sticky top-0 z-10">
          <tr>
            <th scope="col" className="w-[200px] px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">
              Lead Details
            </th>
            <th scope="col" className="w-[100px] px-2 py-2 text-left text-xs font-semibold text-gray-600">
              Actions
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">
              Status
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">
              Insurance
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">
              Claim #
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">
              Location
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">
              Created
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">
              Last Status Change
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wider whitespace-nowrap">
              Assigned
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors text-sm group">
              <td className="w-[200px] px-3 py-2 whitespace-nowrap">
                <Link href={`/leads/${lead.id}`} className="flex items-center text-gray-900 hover:text-gray-700">
                  <div className="font-medium" title={lead.name || "N/A"}>
                    {truncateString(lead.name, 15)}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
                </Link>
              </td>
              <td className="w-[100px] px-2 py-2 whitespace-nowrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="secondary"
                      size="sm" 
                      className="h-7 bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Actions
                      <MoreHorizontal className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={`/leads/${lead.id}`} className="flex items-center cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Details</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewActivity(lead)} className="cursor-pointer">
                      <Activity className="mr-2 h-4 w-4" />
                      <span>View Activity</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewFiles(lead)} className="cursor-pointer">
                      <Folder className="mr-2 h-4 w-4" />
                      <span>View Files</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {lead.address && (
                      <DropdownMenuItem 
                        onClick={() => window.open(getGoogleMapsUrl(lead.address), "_blank", "noopener,noreferrer")}
                        className="cursor-pointer"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>Open in Maps</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span
                  className={cn(
                    "px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full",
                    getStatusColorClasses(lead.status)
                  )}
                >
                  {lead.status ? formatStatusLabel(lead.status) : "Unknown"}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                {lead.insuranceCompany ? (
                  <div className="flex items-center">
                    <Building2 className="h-3 w-3 mr-1 text-gray-400" />
                    <span>{truncateString(lead.insuranceCompany, 15)}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenEditDialog(lead.id, "insuranceCompany")}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </button>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                {lead.claimNumber || (
                  <button
                    onClick={() => handleOpenEditDialog(lead.id, "claimNumber")}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </button>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex items-center space-x-1">
                  {lead.address ? (
                    <StreetViewTooltip address={lead.address}>
                      <div className="flex items-center cursor-help">
                        <span className="text-xs text-gray-600" title={lead.address}>
                          {truncateString(lead.address, 15)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Open in Google Maps" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(getGoogleMapsUrl(lead.address), "_blank", "noopener,noreferrer");
                          }}
                          className="h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full" 
                        >
                          <MapPin className="h-3 w-3" />
                        </Button>
                      </div>
                    </StreetViewTooltip>
                  ) : (
                    <button
                      onClick={() => handleOpenEditDialog(lead.id, "address")}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                {formatDate(lead.createdAt)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                {lead.latestActivity?.type === 'STATUS_CHANGED' 
                  ? formatDate(lead.latestActivity.createdAt)
                  : 'N/A'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                {lead.assignedTo || "Unassigned"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <InlineEditDialog
        leadId={editDialogState.leadId}
        field={editDialogState.field}
        isOpen={editDialogState.isOpen}
        onClose={handleCloseEditDialog}
        onSuccess={() => {
          // You might want to refresh the leads data here
          handleCloseEditDialog();
        }}
      />
    </div>
  )
}
