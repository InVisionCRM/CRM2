"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trash2, AlertTriangle } from "lucide-react"

interface DeleteLeadDialogProps {
  leadId: string
  leadName: string
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function DeleteLeadDialog({ leadId, leadName, onSuccess, trigger }: DeleteLeadDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for deletion")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Deletion request created successfully")
        setIsOpen(false)
        setReason("")
        onSuccess?.()
      } else {
        toast.error(data.error || "Failed to create deletion request")
      }
    } catch (error) {
      console.error('Error creating deletion request:', error)
      toast.error("Failed to create deletion request")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Request Lead Deletion
          </DialogTitle>
          <DialogDescription>
            You are requesting to delete "{leadName}". This request will be sent to administrators for approval.
            Please provide a reason for the deletion.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Deletion *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why this lead should be deleted..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">Important:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Your deletion request will be reviewed by administrators</li>
                  <li>• The lead will remain active until approved</li>
                  <li>• You will be notified once the request is processed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false)
              setReason("")
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 