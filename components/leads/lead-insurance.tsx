"use client"

import type { Lead } from "@/types/lead"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Phone, Mail, DollarSign } from "lucide-react"

interface LeadInsuranceProps {
  lead: Lead
}

export function LeadInsurance({ lead }: LeadInsuranceProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Insurance Company</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{lead.insuranceCompany || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Policy #: {lead.insurancePolicyNumber || "Not provided"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Insurance Contact</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{lead.insurancePhone || "No phone provided"}</span>
            </div>
            {lead.insuranceSecondaryPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Secondary: {lead.insuranceSecondaryPhone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Adjuster Information</h3>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Name:</span>
              <span>{lead.insuranceAdjusterName || "Not assigned"}</span>
            </div>
            {lead.insuranceAdjusterPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{lead.insuranceAdjusterPhone}</span>
              </div>
            )}
            {lead.insuranceAdjusterEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{lead.insuranceAdjusterEmail}</span>
              </div>
            )}
          </div>
        </div>

        {lead.insuranceDeductible && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Deductible</h3>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>${lead.insuranceDeductible.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 