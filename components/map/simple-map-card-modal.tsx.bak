"use client"

import React from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PropertyVisitStatus } from "./types"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SimpleMapCardModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  streetViewUrl?: string
  availableStatuses?: PropertyVisitStatus[]
  currentStatus?: PropertyVisitStatus
  onStatusChange: (status: PropertyVisitStatus) => void
  leadId?: string
}

// Map status to colors with explicit colors for inline styles
const statusColors: Record<PropertyVisitStatus, string> = {
  "No Answer": "#3b82f6", // blue
  "Not Interested": "#ef4444", // red
  "Follow up": "#f59e0b", // amber
  "Inspected": "#22c55e", // green
  "In Contract": "#6366f1", // indigo
}

export function SimpleMapCardModal({
  isOpen,
  onClose,
  address,
  streetViewUrl = "https://via.placeholder.com/600x300/cccccc/969696?text=Street+View+Not+Available",
  availableStatuses = ["No Answer", "Not Interested", "Follow up", "Inspected", "In Contract"],
  currentStatus,
  onStatusChange,
  leadId,
}: SimpleMapCardModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] p-0">
        <DialogTitle className="sr-only">Property details for {address}</DialogTitle>
        <Card className="border-0">
          <CardHeader className="bg-zinc-900 text-white p-4 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-xl">{address}</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="text-white hover:bg-zinc-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <img 
                  src={streetViewUrl} 
                  alt={`Street view of ${address}`}
                  className="w-full rounded-lg"
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Property Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableStatuses.map((status) => {
                    const isActive = currentStatus === status;
                    const backgroundColor = statusColors[status];
                    
                    return (
                      <Button
                        key={status}
                        onClick={() => onStatusChange(status)}
                        variant={isActive ? "default" : "outline"}
                        style={{
                          backgroundColor: isActive ? backgroundColor : undefined,
                          color: isActive ? "white" : undefined,
                          borderColor: backgroundColor
                        }}
                      >
                        {status}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
} 