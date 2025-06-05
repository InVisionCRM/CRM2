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
          <SelectTrigger className="w-full bg-white text-black border-lime-500/20 hover:bg-white/90 flex justify-center items-center min-h-[40px]">
            <div className="flex-1 flex justify-center items-center">
              <SelectValue placeholder="Select status">
                {isLoading && loadingStatus === currentStatus ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-center">Updating...</span>
                  </div>
                ) : (
                  <span className="text-center block w-full">{formatStatusLabel(currentStatus)}</span>
                )}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border-lime-500/20">
            <SelectGroup className="bg-white">
              <SelectLabel className="text-black text-center font-semibold w-full pb-2">Lead Status</SelectLabel>
              {Object.values(LeadStatus).map((status) => (
                <SelectItem 
                  key={status} 
                  value={status}
                  disabled={isLoading}
                  className={`flex flex-col items-center justify-center w-full text-black hover:bg-lime-500/10 data-[highlighted]:bg-lime-500/10 data-[highlighted]:text-black py-2 ${
                    currentStatus === status ? 'bg-lime-500/10' : 'bg-white'
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