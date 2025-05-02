"use client"

import { useState, useRef } from "react"
import { Phone, Mail, MapPin, ExternalLink, Shield, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatStatusLabel } from "@/lib/utils"
import type { LeadSummary } from "@/types/dashboard"
import { FilesSheet } from "@/components/files/files-sheet"

interface ExpandableLeadCardProps {
  lead: LeadSummary
}

export function ExpandableLeadCard({ lead }: ExpandableLeadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFilesSheetOpen, setIsFilesSheetOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  // Get status color classes
  const getStatusStyles = () => {
    switch (lead.status) {
      case "signed_contract":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
      case "colors":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100"
      case "acv":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100"
      case "job":
        return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100"
      case "completed_jobs":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
      case "zero_balance":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
      case "denied":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
      case "follow_ups":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
    }
  }

  // Mock files for demonstration
  const mockFiles = []

  return (
    <>
      <div className="border rounded-lg overflow-hidden mb-3 relative z-20 bg-background">
        {/* Card Header - Always Visible */}
        <div
          className="px-4 py-2 cursor-pointer"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-controls={`lead-content-${lead.id}`}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm">{lead.name}</h3>
            <div
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusStyles()}`}
            >
              {formatStatusLabel(lead.status)}
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        <div
          id={`lead-content-${lead.id}`}
          className={cn(
            "overflow-hidden transition-all duration-300 border-t border-gray-200 dark:border-gray-700",
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
          )}
          ref={contentRef}
        >
          <div className="p-4 space-y-4">
            {/* Contact Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contact Information</h4>
              <div className="space-y-2">
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3.5 w-3.5 mr-2" />
                  {lead.phone}
                </a>
                <a
                  href={`mailto:${lead.email || "example@example.com"}`}
                  className="flex items-center text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-3.5 w-3.5 mr-2" />
                  {lead.email || "Email not available"}
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(lead.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  <span className="break-words">{lead.address}</span>
                  <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                </a>
              </div>
            </div>

            {/* Insurance Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Insurance Information</h4>
              <div className="flex items-center">
                <Shield className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span className="text-sm">State Farm • Policy: SF-12345</span>
              </div>
              <a
                href={`tel:800-782-8332`}
                className="flex items-center text-sm text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3.5 w-3.5 mr-2" />
                800-782-8332
              </a>
            </div>

            {/* Files Section */}
            <div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsFilesSheetOpen(true)
                }}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                View Files & Documents
              </Button>
            </div>

            {/* Additional Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `/leads/${lead.id}`
                }}
              >
                View Full Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Files Sheet */}
      <FilesSheet
        isOpen={isFilesSheetOpen}
        onClose={() => setIsFilesSheetOpen(false)}
        files={mockFiles}
        leadId={lead.id}
      />
    </>
  )
}
