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
            "flex items-center gap-1 text-lg h-10 px-3 w-full sm:w-[100px]", // Reduced width
            disabled ? "cursor-not-allowed opacity-70" : "",
            triggerClassName
          )}
        >
          <span className="font-medium">{getActiveStatusTriggerLabel()}</span>
          <ChevronDown className="h-5 w-5 opacity-80" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px] text-lg"> {/* Reduced width */}
        <DropdownMenuLabel className="text-lg text-center">Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup 
          value={activeStatus || "all"} 
          onValueChange={(value) => {
            onStatusSelect(value === "all" ? null : value as LeadStatus);
          }}
        >
          <DropdownMenuRadioItem value="all" className="text-lg py-4 text-center">
            All Statuses 
            <span className="ml-auto text-lg font-bold text-red-500 right-8">{totalLeads}</span>
          </DropdownMenuRadioItem>
          {statusCounts.map((statusInfo) => (
            <DropdownMenuRadioItem 
              key={statusInfo.status} 
              value={statusInfo.status}
              className="text-lg py-4 text-center justify-center"
            >
              {formatStatusLabel(statusInfo.status)}
              <span className="ml-auto text-lg font-bold text-red-500">{statusInfo.count}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 