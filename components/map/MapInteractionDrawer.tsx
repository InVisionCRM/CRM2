"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Define the specific status type
export type PropertyVisitStatus =
  | "No Answer"
  | "Not Interested"
  | "Follow up"
  | "Inspected"
  | "In Contract"

interface MapInteractionDrawerProps {
  isOpen: boolean
  onClose: () => void
  address: string
  streetViewUrl?: string // Optional URL for the static image
  // Use the specific status type
  availableStatuses?: PropertyVisitStatus[]
  currentStatus?: PropertyVisitStatus
  onStatusChange: (status: PropertyVisitStatus) => void
  onExpand: () => void // Function to trigger expansion
  // Add props for expanded state control
  isExpanded: boolean
  onCollapse: () => void
}

// Define the new default statuses
const defaultStatuses: PropertyVisitStatus[] = [
  "No Answer",
  "Not Interested",
  "Follow up",
  "Inspected",
  "In Contract",
]

export function MapInteractionDrawer({
  isOpen,
  onClose,
  address,
  streetViewUrl = "https://via.placeholder.com/600x300/cccccc/969696?text=Street+View+Not+Available", // Default placeholder
  availableStatuses = defaultStatuses, // Use the new default statuses
  currentStatus,
  onStatusChange,
  onExpand,
  isExpanded,
  onCollapse,
}: MapInteractionDrawerProps) {
  if (!isOpen) {
    return null
  }

  return (
    // Drawer container - fixed positioning at the bottom
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Semi-transparent backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true" // Indicate it's decorative/for closing
      ></div>

      {/* Drawer content area - Keep z-50 to be above backdrop */}
      <div className="relative z-50 bg-base-100 text-base-content rounded-t-lg shadow-lg overflow-hidden">
        {/* Handle / Expand Button */}
        <div className="w-full flex justify-center pt-2 pb-1 cursor-pointer" onClick={onExpand}>
          <div className="w-10 h-1 bg-base-300 rounded-full"></div>
        </div>

        {/* Close Button (Top Right) */}
        <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-base-content/70 hover:bg-base-300/50"
            onClick={onClose}
            aria-label="Close Drawer"
        >
            <X className="h-5 w-5" />
        </Button>


        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Street View Image */}
          <div className="relative h-40 md:h-48 rounded-md overflow-hidden bg-base-200">
            <img
              src={streetViewUrl}
              alt={`Street view of ${address}`}
              className="w-full h-full object-cover"
              // Add error handling if needed: onError={(e) => e.currentTarget.src = 'fallback-image-url'}
            />
            {/* Address Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
              <p className="text-white text-sm font-semibold truncate">{address}</p>
            </div>
          </div>

          {/* Status Buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-base-content/80">Update Visit Status:</p>
            <div className="grid grid-cols-2 gap-2">
              {availableStatuses.map((status) => (
                <Button
                  key={status}
                  // Use DaisyUI button classes for styling
                  className={cn(
                    "btn", // Use standard button size (removed btn-sm)
                    "py-3 h-auto", // Increase vertical padding and allow height to adjust
                    currentStatus === status 
                      ? "btn-primary" // Style for active
                      : "btn-outline btn-ghost", // Style for inactive (outline + ghost for less emphasis)
                    "w-full justify-start text-left" // Ensure text aligns left
                  )}
                  onClick={() => onStatusChange(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

           {/* Placeholder for Expand Action - can be integrated into the handle */}
           {/* <Button variant="outline" size="sm" className="w-full mt-2" onClick={onExpand}>
              <ChevronUp className="h-4 w-4 mr-2" /> Expand for Details
           </Button> */}

        </div>
      </div>
    </div>
  )
} 