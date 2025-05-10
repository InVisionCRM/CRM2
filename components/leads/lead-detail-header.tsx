"use client"

import { useState } from "react"
import { ArrowLeft, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { cn, getStatusColor, formatStatusLabel } from "@/lib/utils"
import { AppointmentCountdown } from "@/components/leads/appointment-countdown"
import { StatusGrid } from "@/components/status-grid"
import { updateLeadStatus } from "@/app/actions/lead-actions"
import { useToast } from "@/hooks/use-toast"
import type { Lead, LeadStatus } from "@/types/lead"

interface LeadDetailHeaderProps {
  lead: Lead
  adjusterAppointmentDate?: Date | null
  adjusterAppointmentTime?: string | null
}

export function LeadDetailHeader({ lead, adjusterAppointmentDate, adjusterAppointmentTime }: LeadDetailHeaderProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleStatusChange = async (status: LeadStatus | null) => {
    if (status === null) {
      return;
    }
    try {
      const result = await updateLeadStatus(lead.id, status)

      if (result.success) {
        toast({
          title: "Status updated",
          description: `Lead status changed to ${formatStatusLabel(status)}`,
        })
        setIsStatusDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Button>
          </Link>
          <h1 className="text-lg font-semibold truncate">{`${lead.firstName || ''} ${lead.lastName || ''}`.trim() || "N/A"}</h1>
          <Badge className={cn("ml-3 px-3 py-1 text-sm font-medium", getStatusColor(lead.status))}>
            {formatStatusLabel(lead.status)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {adjusterAppointmentDate && adjusterAppointmentTime && (
            <AppointmentCountdown appointmentDate={adjusterAppointmentDate} appointmentTime={adjusterAppointmentTime} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Lead</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}>Change Status</DropdownMenuItem>
              <DropdownMenuItem>Delete Lead</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Lead Status</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <StatusGrid 
                  onStatusClick={handleStatusChange} 
                  activeStatus={lead.status}
                  statusCounts={[]}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
