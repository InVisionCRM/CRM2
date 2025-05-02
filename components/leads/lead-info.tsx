"use client"

import type { Lead } from "@/types/lead"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin, User2, Calendar } from "lucide-react"
import { format } from "date-fns"

interface LeadInfoProps {
  lead: Lead
}

export function LeadInfo({ lead }: LeadInfoProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{lead.email || "No email provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{lead.phone || "No phone provided"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p>{lead.address || "No address provided"}</p>
              {(lead.city || lead.state || lead.zipCode) && (
                <p>
                  {[lead.city, lead.state, lead.zipCode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Additional Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{lead.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              <p className="font-medium">{lead.assignedTo || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Source</p>
              <p className="font-medium">{lead.source}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(lead.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 