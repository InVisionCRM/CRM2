"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, getStatusColor, formatStatusLabel } from "@/lib/utils"
import type { Lead } from "@/types/lead"

interface LeadStatusHistoryProps {
  lead: Lead
}

export function LeadStatusHistory({ lead }: LeadStatusHistoryProps) {
  // In a real app, this would come from the database
  const statusHistory = [
    {
      status: "signed_contract",
      date: lead.createdAt,
      user: "Mike Johnson",
    },
    {
      status: "scheduled",
      date: new Date(2023, 6, 26),
      user: "Mike Johnson",
    },
  ]

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Status History</h2>
        </div>

        <div className="relative pl-6 border-l border-gray-200 dark:border-gray-700 space-y-4">
          {statusHistory.map((item, index) => (
            <div key={index} className="relative pb-4">
              <div className="absolute -left-[21px] mt-1.5 h-4 w-4 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Badge className={cn("font-normal", getStatusColor(item.status))}>
                    {formatStatusLabel(item.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{formatDate(item.date)}</span>
                </div>
                <p className="text-sm mt-1">Changed by {item.user}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
