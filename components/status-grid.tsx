"use client"
import type { StatusCount } from "@/types/dashboard"
import { LeadStatus } from "@prisma/client"
import { formatStatusLabel } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface StatusGridProps {
  onStatusClick: (status: LeadStatus | null) => void
  activeStatus: LeadStatus | null
  statusCounts: StatusCount[]
}

export function StatusGrid({ onStatusClick, activeStatus, statusCounts }: StatusGridProps) {
  const totalLeads = statusCounts.reduce((sum, status) => sum + status.count, 0)

  return (
    <Select
      value={activeStatus || "all"}
      onValueChange={(value) => onStatusClick(value === "all" ? null : value as LeadStatus)}
    >
      <SelectTrigger className="w-[280px] bg-white/5 border-lime-500/20 text-lime-500">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Lead Status</SelectLabel>
          <SelectItem value="all" className="flex justify-between">
            <span>All Leads</span>
            <span className="ml-2 text-xs bg-lime-500/10 text-lime-500 px-2 py-0.5 rounded-full">
              {totalLeads}
            </span>
          </SelectItem>
          {statusCounts.map((statusItem) => (
            <SelectItem 
              key={statusItem.status} 
              value={statusItem.status}
              className="flex justify-between"
            >
              <span>{formatStatusLabel(statusItem.status)}</span>
              <span className="ml-2 text-xs bg-lime-500/10 text-lime-500 px-2 py-0.5 rounded-full">
                {statusItem.count}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
