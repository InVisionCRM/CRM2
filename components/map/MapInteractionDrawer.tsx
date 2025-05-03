"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
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
  streetViewUrl?: string
  availableStatuses?: PropertyVisitStatus[]
  currentStatus?: PropertyVisitStatus
  onStatusChange: (status: PropertyVisitStatus) => void
  onExpand: () => void
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

// Map status to colors with explicit colors for inline styles
const statusColors: Record<PropertyVisitStatus, { bg: string, hover: string, icon: string, color: string }> = {
  "No Answer": { bg: "bg-blue-500", hover: "hover:bg-blue-600", icon: "❓", color: "#3b82f6" },
  "Not Interested": { bg: "bg-red-500", hover: "hover:bg-red-600", icon: "✖️", color: "#ef4444" },
  "Follow up": { bg: "bg-amber-500", hover: "hover:bg-amber-600", icon: "📅", color: "#f59e0b" },
  "Inspected": { bg: "bg-green-500", hover: "hover:bg-green-600", icon: "✅", color: "#22c55e" },
  "In Contract": { bg: "bg-indigo-500", hover: "hover:bg-indigo-600", icon: "📝", color: "#6366f1" },
}

export function MapInteractionDrawer({
  isOpen,
  onClose,
  address,
  streetViewUrl = "https://via.placeholder.com/600x300/cccccc/969696?text=Street+View+Not+Available",
  availableStatuses = defaultStatuses,
  currentStatus,
  onStatusChange,
  onExpand,
  isExpanded,
  onCollapse,
}: MapInteractionDrawerProps) {
  if (!isOpen) {
    return null
  }

  // Determine the drawer height based on expanded state
  const drawerHeight = isExpanded ? "75vh" : "25vh";

  return (
    // Drawer container - fixed at bottom
    <div style={{ 
      position: 'fixed', 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 50 
    }}>
      {/* Drawer content with forced black background */}
      <div 
        style={{ 
          backgroundColor: "#000", 
          color: "white", 
          borderTopLeftRadius: "0.5rem", 
          borderTopRightRadius: "0.5rem", 
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", 
          overflow: "hidden", 
          transition: "all 0.3s", 
          position: "relative", 
          zIndex: 50, 
          height: drawerHeight 
        }}
      >
        {/* Green gradient at top */}
        <div 
          style={{ 
            background: "linear-gradient(to bottom, #84cc16 0%, #000000 100%)", 
            width: "100%", 
            height: "2.5rem", 
            cursor: "pointer" 
          }}
          onClick={isExpanded ? onCollapse : onExpand}
        >
          {/* Handle indicator */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", paddingTop: "0.5rem" }}>
            <div style={{ width: "2.5rem", height: "0.25rem", backgroundColor: "rgba(255, 255, 255, 0.5)", borderRadius: "9999px" }}></div>
          </div>
        </div>

        {/* Two-column layout container */}
        <div style={{ display: "flex", height: "calc(100% - 2.5rem)", padding: "0.5rem" }}>
          {/* Left column: Street View (narrower) */}
          <div style={{ width: "40%", paddingRight: "0.25rem", height: "100%" }}>
            <div style={{ position: "relative", height: "100%", borderRadius: "0.375rem", overflow: "hidden", backgroundColor: "#1f2937" }}>
              <img
                src={streetViewUrl}
                alt={`Street view of ${address}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {/* Address Overlay */}
              <div style={{ 
                position: "absolute", 
                bottom: 0, 
                left: 0, 
                right: 0, 
                padding: "0.5rem", 
                background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.5) 50%, transparent)" 
              }}>
                <p style={{ color: "white", fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{address}</p>
              </div>
            </div>
          </div>

          {/* Right column: Status Buttons in Bento Grid (wider) */}
          <div style={{ width: "60%", paddingLeft: "0.25rem", height: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: "0.5rem", height: "100%" }}>
              {availableStatuses.map((status) => {
                const colorStyle = statusColors[status] || { bg: "bg-gray-500", hover: "hover:bg-gray-600", icon: "?", color: "#6b7280" };
                
                return (
                  <button
                    key={status}
                    style={{ 
                      height: "100%", 
                      display: "flex", 
                      flexDirection: "column", 
                      justifyContent: "center", 
                      alignItems: "center", 
                      padding: "0.25rem", 
                      backgroundColor: colorStyle.color, 
                      borderRadius: "0.5rem", 
                      fontWeight: 600, 
                      color: "white", 
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      border: currentStatus === status ? "2px solid white" : "none",
                      fontSize: "1.25rem"
                    }}
                    onClick={() => onStatusChange(status)}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 