"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useUpdateLead } from "@/hooks/use-update-lead"
import { useDeleteLead } from "@/hooks/use-delete-lead"
import { useRouter } from "next/navigation"
import { Loader2, Trash, Edit, CheckCircle, XCircle } from "lucide-react"
import type { Lead } from "@/types/lead"
import { LeadStatus } from "@prisma/client"

interface LeadActionsProps {
  lead: Lead
}

export function LeadActions({ lead }: LeadActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { updateLead, isLoading: isUpdating } = useUpdateLead()
  const { deleteLead, isLoading: isDeleting } = useDeleteLead()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleStatusUpdate = async (status: LeadStatus) => {
    try {
      await updateLead(lead.id, { status })
      toast({
        title: "Status updated",
        description: `Lead status updated to ${status.replace("_", " ")}`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead status",
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
    <div className="flex flex-wrap gap-2 items-center">
      {lead.status !== LeadStatus.signed_contract && lead.status !== LeadStatus.completed_jobs && lead.status !== LeadStatus.zero_balance && (
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          onClick={() => handleStatusUpdate(LeadStatus.signed_contract)}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
          Mark Won (Sign Contract)
        </Button>
      )}

      {lead.status !== LeadStatus.denied && (
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => handleStatusUpdate(LeadStatus.denied)}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
          Mark Lost (Denied)
        </Button>
      )}

      <Button variant="outline" size="sm" onClick={() => router.push(`/leads/${lead.id}/edit`)}>
        <Edit className="h-4 w-4 mr-1" />
        Edit
      </Button>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-red-600">
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </AlertDialogTrigger>
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
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
