"use client"

import { formatDistanceToNow, format, isValid } from "date-fns"
import type { Lead } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatStatusLabel } from "@/lib/utils"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Avatar removed
import { Badge } from "@/components/ui/badge"

interface LeadOverviewTabProps {
  lead: Lead | null
}

export function LeadOverviewTab({ lead }: LeadOverviewTabProps) {
  if (!lead) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm card">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
              <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4 sm:px-6 sm:pb-5">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const createdDate = lead.createdAt ? new Date(lead.createdAt) : null;
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "N/A";
  const addressDisplay = lead.address || "No address provided";

  // const getInitials = ...; // No longer needed

  return (
    // Use a more flexible grid that attempts 2 columns, but can shrink to 1 if necessary.
    // Adjust gap and padding for smaller screens.
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 md:gap-6">
      {/* Lead Summary Card */}
      <Card className="shadow-sm card">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-md sm:text-lg">Lead Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5">
          {/* Each item will now effectively be on its own row due to stacking or single column grid */}
          <div className="space-y-2"> {/* Changed from grid-cols-2 */}
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={lead.status as any} className="text-xs px-1.5 py-0.5 sm:text-sm sm:px-2 sm:py-1">{formatStatusLabel(lead.status)}</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Created</p>
              {createdDate && isValid(createdDate) ? (
                <>
                  <p className="text-xs sm:text-sm" title={createdDate.toISOString()}>{format(createdDate, "MMM d, yyyy")}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {formatDistanceToNow(createdDate, { addSuffix: true })}
                  </p>
                </>
              ) : <p className="text-xs sm:text-sm text-muted-foreground">Invalid date</p>}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Damage Type</p>
              <p className="text-xs sm:text-sm">{lead.damageType || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Claim Number</p>
              <p className="text-xs sm:text-sm">{lead.claimNumber || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Contact Information Card */}
      <Card className="shadow-sm card">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-md sm:text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5">
          {/* Avatar removed */}
          <div>
            <p className="font-medium text-sm sm:text-base">{fullName}</p>
            <p className="text-xs sm:text-sm text-muted-foreground break-all">{lead.email || "No email"}</p>
          </div>
          
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-xs sm:text-sm">{lead.phone || "No phone"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-xs sm:text-sm">{addressDisplay}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Insurance Information Card */}
      <Card className="shadow-sm card">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-md sm:text-lg">Insurance Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Company</p>
              <p className="text-xs sm:text-sm">{lead.insuranceCompany || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Policy #</p>
              <p className="text-xs sm:text-sm">{lead.insurancePolicyNumber || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ins. Phone</p>
              <p className="text-xs sm:text-sm">{lead.insurancePhone || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Deductible</p>
              <p className="text-xs sm:text-sm">{lead.insuranceDeductible || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Adjuster Information Card */}
      <Card className="shadow-sm card">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-md sm:text-lg">Adjuster Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Adjuster Name</p>
              <p className="text-xs sm:text-sm">{lead.insuranceAdjusterName || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Adjuster Phone</p>
              <p className="text-xs sm:text-sm">{lead.insuranceAdjusterPhone || "N/A"}</p>
            </div>
            <div className="space-y-0.5 col-span-1 sm:col-span-2">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Adjuster Email</p>
              <p className="text-xs sm:text-sm break-all">{lead.insuranceAdjusterEmail || "N/A"}</p>
            </div>
            <div className="space-y-0.5 col-span-1 sm:col-span-2">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Next Appointment</p>
              <p className="text-xs sm:text-sm">
                {lead.adjusterAppointmentDate && isValid(new Date(lead.adjusterAppointmentDate)) 
                  ? format(new Date(lead.adjusterAppointmentDate), "MMM d, yyyy") +
                    (lead.adjusterAppointmentTime ? ` at ${lead.adjusterAppointmentTime}` : '')
                  : "No appointment"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 