"use client"

import { useState } from "react"
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { useDeleteLead } from "@/hooks/use-delete-lead"
import { cn, getStatusColor, formatStatusLabel } from "@/lib/utils"
import { AppointmentCountdown } from "@/components/leads/appointment-countdown"
import { StatusGrid } from "@/components/status-grid"
import { updateLeadStatus } from "@/app/actions/lead-actions"
import type { Lead, LeadStatus } from "@/types/lead"
import { UserRole } from "@prisma/client"

interface LeadDetailHeaderProps {
  lead: Lead
  adjusterAppointmentDate?: Date | null
  adjusterAppointmentTime?: string | null
}

export function LeadDetailHeader({ lead, adjusterAppointmentDate, adjusterAppointmentTime }: LeadDetailHeaderProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { data: session } = useSession()
  const { deleteLead, isLoading: isDeleting } = useDeleteLead()

  // Check if user can delete this lead
  const canDeleteLead = () => {
    if (!session?.user?.id) return false
    
    // Admins can delete any lead
    if (session.user.role === UserRole.ADMIN) return true
    
    // Users can only delete their assigned leads
    return lead.assignedToId === session.user.id
  }

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

  const handleDelete = async () => {
    try {
      await deleteLead(lead.id)
      toast({
        title: "Lead deleted",
        description: "Lead has been successfully deleted",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
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
              {canDeleteLead() && (
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Lead
                </DropdownMenuItem>
              )}
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

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the lead and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  )
}
