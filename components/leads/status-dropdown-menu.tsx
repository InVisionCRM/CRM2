"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { StatusCount } from "@/types/dashboard"
import { LeadStatus } from "@prisma/client"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Assuming a utility function like this exists or can be created:
// e.g., in @/lib/utils.ts
// export const formatStatusLabel = (status: string): string => {
//   if (!status) return "Unknown";
//   return status
//     .split("_")
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//     .join(" ");
// };
import { formatStatusLabel } from "@/lib/utils"; // Make sure this path and function exist

interface StatusDropdownMenuProps {
  statusCounts: StatusCount[];
  activeStatus: LeadStatus | null;
  onStatusSelect: (status: LeadStatus | null) => void;
  triggerClassName?: string;
  disabled?: boolean;
}

export function StatusDropdownMenu({
  statusCounts,
  activeStatus,
  onStatusSelect,
  triggerClassName,
  disabled = false,
}: StatusDropdownMenuProps) {
  
  const getActiveStatusTriggerLabel = () => {
    if (!activeStatus) return "All";
    const active = statusCounts.find(s => s.status === activeStatus);
    // Return only the formatted status label for the trigger for brevity
    return active ? formatStatusLabel(active.status) : formatStatusLabel(activeStatus);
  };

  const totalLeads = statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button 
          variant="outline" 
          className={cn(
            "flex items-center gap-1.5 text-sm h-9 px-3", // Compact styling
            disabled ? "cursor-not-allowed opacity-70" : "",
            triggerClassName
          )}
        >
          <span>Status:</span>
          <span className="font-medium">{getActiveStatusTriggerLabel()}</span>
          <ChevronDown className="h-4 w-4 opacity-80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64"> {/* Increased width for counts */}
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup 
          value={activeStatus || "all"} 
          onValueChange={(value) => {
            onStatusSelect(value === "all" ? null : value as LeadStatus);
          }}
        >
          <DropdownMenuRadioItem value="all" className="text-sm">
            All Statuses 
            <span className="ml-auto text-xs opacity-70">{totalLeads}</span>
          </DropdownMenuRadioItem>
          {statusCounts.map((statusInfo) => (
            <DropdownMenuRadioItem 
              key={statusInfo.status} 
              value={statusInfo.status}
              className="text-sm"
            >
              {formatStatusLabel(statusInfo.status)}
              <span className="ml-auto text-xs opacity-70">{statusInfo.count}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 