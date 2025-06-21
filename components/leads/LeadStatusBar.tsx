"use client"

import { LeadStatus } from "@prisma/client"
import { formatStatusLabel } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LeadStatusBarProps {
  currentStatus: LeadStatus
  onStatusChange: (status: LeadStatus) => void
  isLoading?: boolean
  loadingStatus?: LeadStatus | null
}

export function LeadStatusBar({ currentStatus, onStatusChange, isLoading, loadingStatus }: LeadStatusBarProps) {
  return (
    <div className="w-full flex justify-center items-center">
      <div className="w-[280px]">
        <Select
          value={currentStatus}
          onValueChange={(value) => onStatusChange(value as LeadStatus)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full bg-gradient-to-b from-black via-zinc-800 to-zinc-900 text-lime-300 border border-lime-500/40 shadow-[0_0_8px_rgba(0,255,128,0.4)] hover:shadow-[0_0_10px_rgba(0,255,128,0.6)] hover:bg-zinc-800 flex justify-center items-center min-h-[44px] rounded-xl backdrop-blur-sm">
            <div className="flex-1 flex justify-center items-center">
              <SelectValue placeholder="Select status">
                {isLoading && loadingStatus === currentStatus ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-center">Updating...</span>
                  </div>
                ) : (
                  <span className="text-center block w-full tracking-wide font-semibold text-sm sm:text-base">{formatStatusLabel(currentStatus)}</span>
                )}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border border-lime-500/30 shadow-inner shadow-lime-500/10 rounded-xl">
            <SelectGroup className="bg-transparent">
              <SelectLabel className="text-lime-400 text-center font-semibold w-full pb-2">Lead Status</SelectLabel>
              {Object.values(LeadStatus).map((status) => (
                <SelectItem 
                  key={status} 
                  value={status}
                  disabled={isLoading}
                  className={`flex flex-col items-center justify-center w-full text-lime-100 hover:bg-lime-500/10 data-[highlighted]:bg-lime-500/20 data-[highlighted]:text-lime-100 py-2 transition-colors ${
                    currentStatus === status ? 'bg-lime-500/10' : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-center justify-center w-full">
                    <span className="text-center">{formatStatusLabel(status)}</span>
                    {isLoading && loadingStatus === status && (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 