"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import type { LeadSummary } from "@/types/dashboard"

interface LeadsListProps {
  leads: LeadSummary[]
  isLoading?: boolean
  assignedTo?: string | null
}

export function LeadsList({ leads, isLoading = false, assignedTo }: LeadsListProps) {
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "signed_contract":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "colors":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
      case "acv":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "job":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "completed_jobs":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "zero_balance":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "denied":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "follow_ups":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const formatStatusLabel = (status: string): string => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <Link href={`/leads/${lead.id}`} key={lead.id}>
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{lead.name}</h3>
                  <p className="text-sm text-muted-foreground">{lead.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm">{lead.phone}</p>
                    <span className="text-muted-foreground">•</span>
                    <p className="text-sm">{lead.email}</p>
                  </div>
                  {lead.appointmentDate && (
                    <p className="text-sm mt-1">
                      Appointment: {formatDistanceToNow(new Date(lead.appointmentDate), { addSuffix: true })}
                    </p>
                  )}
                </div>
                <Badge className={`${getStatusBadgeColor(lead.status)}`}>{formatStatusLabel(lead.status)}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
