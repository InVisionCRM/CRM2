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

const getStatusGlowCssProperties = (status: LeadStatus | null): React.CSSProperties => {
  let glowColor = "rgba(107, 114, 128, 0.6)"; 
  switch (status) {
    case LeadStatus.signed_contract: glowColor = "rgba(59, 130, 246, 0.7)"; break;
    case LeadStatus.scheduled: case LeadStatus.colors: glowColor = "rgba(139, 92, 246, 0.7)"; break;
    case LeadStatus.acv: glowColor = "rgba(234, 179, 8, 0.7)"; break;
    case LeadStatus.job: glowColor = "rgba(99, 102, 241, 0.7)"; break;
    case LeadStatus.completed_jobs: glowColor = "rgba(34, 197, 94, 0.7)"; break;
    case LeadStatus.zero_balance: glowColor = "rgba(107, 114, 128, 0.7)"; break;
    case LeadStatus.denied: glowColor = "rgba(239, 68, 68, 0.7)"; break;
    case LeadStatus.follow_ups: glowColor = "rgba(249, 115, 22, 0.7)"; break;
  }
  return { boxShadow: `inset 0 0 18px 6px ${glowColor}` };
};

export function StatusGrid({ onStatusClick, activeStatus, statusCounts }: StatusGridProps) {
  const totalLeads = statusCounts.reduce((sum, status) => sum + status.count, 0)

  const getStatusIcon = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.signed_contract: return <FileSignature className="w-8 h-8" />;
      case LeadStatus.scheduled: return <Calendar className="w-8 h-8" />;
      case LeadStatus.colors: return <Palette className="w-8 h-8" />;
      case LeadStatus.acv: return <FileText className="w-8 h-8" />;
      case LeadStatus.job: return <Briefcase className="w-8 h-8" />;
      case LeadStatus.completed_jobs: return <CheckCircle className="w-8 h-8" />;
      case LeadStatus.zero_balance: return <DollarSign className="w-8 h-8" />;
      case LeadStatus.denied: return <XCircle className="w-8 h-8" />;
      case LeadStatus.follow_ups: return <PhoneCall className="w-8 h-8" />;
      default: return <Users className="w-8 h-8" />;
    }
  }

  const getTextColorClass = (status: LeadStatus) => {
    const fullColorClass = getStatusColor(status)
    const textColorMatch = fullColorClass.match(/text-[a-z]+-\d+/)
    return textColorMatch ? textColorMatch[0] : "text-gray-800"
  }

  const getDarkTextColorClass = (status: LeadStatus) => {
    const fullColorClass = getStatusColor(status)
    const darkTextColorMatch = fullColorClass.match(/dark:text-[a-z]+-\d+/)
    return darkTextColorMatch ? darkTextColorMatch[0] : "dark:text-gray-100"
  }

  return (
    <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-1 md:gap-2 auto-rows-fr">
      <div
        className={`card relative rounded-xl overflow-hidden cursor-pointer transition-all aspect-square p-3 md:p-4 ${
          activeStatus === null ? "ring-2 ring-blue-500 scale-105" : ""
        }`}
        style={getStatusGlowCssProperties(null)}
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

      {statusCounts.map((statusItem) => {
        const textColorClass = getTextColorClass(statusItem.status as LeadStatus)
        const darkTextColorClass = getDarkTextColorClass(statusItem.status as LeadStatus)
        const statusIcon = getStatusIcon(statusItem.status as LeadStatus)

        return (
          <div
            key={statusItem.status}
            className={`card relative rounded-xl overflow-hidden cursor-pointer transition-all aspect-square p-3 md:p-4 ${
              activeStatus === statusItem.status ? "ring-2 ring-blue-500 scale-105" : ""
            }`}
            style={getStatusGlowCssProperties(statusItem.status as LeadStatus)}
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
