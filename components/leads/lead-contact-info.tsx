"use client"

import { Phone, Mail, MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Lead } from "@/types/lead"

interface LeadContactInfoProps {
  lead: Lead
}

export function LeadContactInfo({ lead }: LeadContactInfoProps) {
  const displayName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || "N/A";
  const googleMapsQuery = lead.address ? encodeURIComponent(lead.address) : '';

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <Button variant="outline" size="sm" className="h-8">
            Edit
          </Button>
        </div>

        <dl className="grid grid-cols-2 gap-x-2 gap-y-3">
          <dt className="text-sm text-muted-foreground">Name</dt>
          <dd className="text-sm font-medium">{displayName}</dd>

          <dt className="text-sm text-muted-foreground">Phone</dt>
          <dd className="text-sm font-medium">
            <a href={`tel:${lead.phone}`} className="flex items-center hover:text-primary">
              <Phone className="h-3 w-3 mr-1" />
              {lead.phone}
            </a>
          </dd>

          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="text-sm font-medium">
            <a href={`mailto:${lead.email}`} className="flex items-center hover:text-primary">
              <Mail className="h-3 w-3 mr-1" />
              {lead.email}
            </a>
          </dd>

          <dt className="text-sm text-muted-foreground">Address</dt>
          <dd className="text-sm font-medium">
            <div>
              <div>{lead.address || "N/A"}</div>
              {lead.address && (
                <a
                  href={`https://maps.google.com/?q=${googleMapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-primary mt-1 text-xs hover:underline"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>View on Maps</span>
                  <ExternalLink className="h-2 w-2 ml-1" />
                </a>
              )}
            </div>
          </dd>
        </dl>
      </CardContent>
    </Card>
  )
}
