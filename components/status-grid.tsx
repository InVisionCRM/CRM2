"use client"
import type { StatusCount } from "@/types/dashboard"
import { LeadStatus } from "@prisma/client"
import {
  Users,
  FileSignature,
  Calendar,
  Palette,
  FileText,
  Briefcase,
  CheckCircle,
  DollarSign,
  XCircle,
  PhoneCall,
} from "lucide-react"
import { getStatusColor, formatStatusLabel } from "@/lib/utils"

interface StatusGridProps {
  onStatusClick: (status: LeadStatus | null) => void
  activeStatus: LeadStatus | null
  statusCounts: StatusCount[]
}

export function StatusGrid({ onStatusClick, activeStatus, statusCounts }: StatusGridProps) {
  // Calculate total leads
  const totalLeads = statusCounts.reduce((sum, status) => sum + status.count, 0)

  // Get icon based on status
  const getStatusIcon = (status: LeadStatus) => {
    switch (status) {
      case "signed_contract":
        return <FileSignature className="w-8 h-8" />
      case "scheduled":
        return <Calendar className="w-8 h-8" />
      case "colors":
        return <Palette className="w-8 h-8" />
      case "acv":
        return <FileText className="w-8 h-8" />
      case "job":
        return <Briefcase className="w-8 h-8" />
      case "completed_jobs":
        return <CheckCircle className="w-8 h-8" />
      case "zero_balance":
        return <DollarSign className="w-8 h-8" />
      case "denied":
        return <XCircle className="w-8 h-8" />
      case "follow_ups":
        return <PhoneCall className="w-8 h-8" />
      default:
        return <Users className="w-8 h-8" />
    }
  }

  // Extract background color class from the full color string
  const getBgColorClass = (status: LeadStatus) => {
    const fullColorClass = getStatusColor(status)
    // Extract just the background color part (bg-color-100)
    const bgColorMatch = fullColorClass.match(/bg-[a-z]+-\d+/)
    return bgColorMatch ? bgColorMatch[0] : "bg-gray-100"
  }

  // Extract text color class from the full color string
  const getTextColorClass = (status: LeadStatus) => {
    const fullColorClass = getStatusColor(status)
    // Extract just the text color part (text-color-800)
    const textColorMatch = fullColorClass.match(/text-[a-z]+-\d+/)
    return textColorMatch ? textColorMatch[0] : "text-gray-800"
  }

  // Get dark mode background color
  const getDarkBgColorClass = (status: LeadStatus) => {
    const fullColorClass = getStatusColor(status)
    // Extract just the dark background color part (dark:bg-color-800)
    const darkBgColorMatch = fullColorClass.match(/dark:bg-[a-z]+-\d+/)
    return darkBgColorMatch ? darkBgColorMatch[0] : "dark:bg-gray-800"
  }

  // Get dark mode text color
  const getDarkTextColorClass = (status: LeadStatus) => {
    const fullColorClass = getStatusColor(status)
    // Extract just the dark text color part (dark:text-color-100)
    const darkTextColorMatch = fullColorClass.match(/dark:text-[a-z]+-\d+/)
    return darkTextColorMatch ? darkTextColorMatch[0] : "dark:text-gray-100"
  }

  return (
    <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-1 md:gap-2 auto-rows-fr">
      {/* Total Leads Card */}
      <div
        className={`relative rounded-xl overflow-hidden cursor-pointer transition-all aspect-square p-3 md:p-4 bg-gray-100 dark:bg-gray-800 ${
          activeStatus === null ? "ring-2 ring-blue-500 scale-105" : ""
        }`}
        onClick={() => onStatusClick(null)}
        role="button"
        aria-label="All Leads"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <Users className="w-8 h-8 text-gray-600 dark:text-gray-300 mb-2" />
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">All Leads</div>
          <div className="mt-1 bg-white dark:bg-gray-700 text-black dark:text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
            {totalLeads}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      {statusCounts.map((statusItem) => {
        const bgColorClass = getBgColorClass(statusItem.status as LeadStatus)
        const textColorClass = getTextColorClass(statusItem.status as LeadStatus)
        const darkBgColorClass = getDarkBgColorClass(statusItem.status as LeadStatus)
        const darkTextColorClass = getDarkTextColorClass(statusItem.status as LeadStatus)

        // Get icon for this status
        const statusIcon = getStatusIcon(statusItem.status as LeadStatus)

        return (
          <div
            key={statusItem.status}
            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all aspect-square p-3 md:p-4 ${bgColorClass} ${darkBgColorClass} ${
              activeStatus === statusItem.status ? "ring-2 ring-blue-500 scale-105" : ""
            }`}
            onClick={() => onStatusClick(statusItem.status)}
            role="button"
            aria-label={formatStatusLabel(statusItem.status)}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className={`${textColorClass} ${darkTextColorClass}`}>{statusIcon}</div>
              <div
                className={`text-xs md:text-sm font-medium ${textColorClass} ${darkTextColorClass} text-center mt-2`}
              >
                {formatStatusLabel(statusItem.status)}
              </div>
              <div className="mt-1 bg-white dark:bg-gray-700 text-black dark:text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                {statusItem.count}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
