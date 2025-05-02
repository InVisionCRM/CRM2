"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLeads } from "@/hooks/use-leads"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { LeadsList } from "@/components/leads-list"
import { cn } from "@/lib/utils"

const STATUS_STYLES = {
  signed_contract: "hover:bg-blue-900/30 hover:border-blue-500 hover:text-blue-500 shadow-[inset_0_0_50px_20px_rgba(59,130,246,0.55)]",
  scheduled: "hover:bg-blue-900/30 hover:border-blue-500 hover:text-blue-500 shadow-[inset_0_0_50px_20px_rgba(59,130,246,0.55)]",
  colors: "hover:bg-indigo-900/30 hover:border-indigo-500 hover:text-indigo-500 shadow-[inset_0_0_50px_20px_rgba(99,102,241,0.55)]",
  acv: "hover:bg-purple-900/30 hover:border-purple-500 hover:text-purple-500 shadow-[inset_0_0_50px_20px_rgba(147,51,234,0.55)]",
  job: "hover:bg-orange-900/30 hover:border-orange-500 hover:text-orange-500 shadow-[inset_0_0_50px_20px_rgba(249,115,22,0.55)]",
  completed_jobs: "hover:bg-green-900/30 hover:border-green-500 hover:text-green-500 shadow-[inset_0_0_50px_20px_rgba(34,197,94,0.55)]",
  zero_balance: "hover:bg-green-900/30 hover:border-green-500 hover:text-green-500 shadow-[inset_0_0_50px_20px_rgba(34,197,94,0.55)]",
  denied: "hover:bg-red-900/30 hover:border-red-500 hover:text-red-500 shadow-[inset_0_0_50px_20px_rgba(239,68,68,0.55)]",
} as const

const LEAD_STATUSES = [
  "signed_contract",
  "scheduled",
  "colors",
  "acv",
  "job",
  "completed_jobs",
  "zero_balance",
  "denied",
] as const

export function SummaryCards() {
  const { leads, isLoading } = useLeads()
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status)
    setIsSheetOpen(true)
  }

  const formatStatusLabel = (status: string): string => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {LEAD_STATUSES.map((status) => (
          <Card
            key={status}
            className="h-24 bg-black animate-pulse rounded-xl overflow-hidden cursor-pointer transition-all border border-white/20"
          >
            <div className="h-full flex items-center justify-center">
              <div className="h-4 w-24 bg-gray-800 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status)
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {LEAD_STATUSES.map((status) => {
          const statusLeads = getLeadsByStatus(status)
          return (
            <Card
              key={status}
              className={cn(
                "h-24 bg-black rounded-xl overflow-hidden cursor-pointer group relative",
                "border border-white/20",
                STATUS_STYLES[status],
                "transform hover:scale-[1.02] transition-all duration-200"
              )}
              onClick={() => handleStatusClick(status)}
            >
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <span className="text-white font-extralight text-lg tracking-wide transition-colors duration-200 group-hover:text-inherit">{formatStatusLabel(status)}</span>
                <span className="text-white font-thin text-sm transition-colors duration-200 group-hover:text-inherit">{statusLeads.length} leads</span>
                <span className="absolute bottom-2 text-xs opacity-0 group-hover:opacity-100 text-white transition-opacity duration-200 font-thin">Show Leads</span>
              </div>
            </Card>
          )
        })}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{selectedStatus ? formatStatusLabel(selectedStatus) : ""} Leads</SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            {selectedStatus && <LeadsList leads={getLeadsByStatus(selectedStatus)} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
