"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Phone } from "lucide-react"

interface PhotoAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadAddress?: string
  claimNumber?: string
  onAssignmentCreated?: () => void
}

export function PhotoAssignmentDialog({
  open,
  onOpenChange,
  leadId,
  leadAddress,
  claimNumber,
  onAssignmentCreated
}: PhotoAssignmentDialogProps) {
  const [contractorPhone, setContractorPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contractorPhone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter the contractor's phone number.",
        variant: "destructive"
      })
      return
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(contractorPhone.replace(/[\s\-\(\)]/g, ''))) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/photo-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId,
          contractorPhone: contractorPhone.trim(),
          notes: notes.trim() || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign photo job')
      }

      toast({
        title: "Photo job assigned successfully",
        description: `Photo access granted for ${leadAddress || 'this lead'}. The contractor will receive a notification.`
      })

      // Reset form
      setContractorPhone("")
      setNotes("")
      onOpenChange(false)
      
      if (onAssignmentCreated) {
        onAssignmentCreated()
      }

    } catch (error) {
      console.error('Error assigning photo job:', error)
      toast({
        title: "Error assigning photo job",
        description: error instanceof Error ? error.message : "Failed to assign photo job. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setContractorPhone("")
      setNotes("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Camera className="h-5 w-5" />
            Assign Photo Job
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-info" className="text-gray-900">Lead Information</Label>
            <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>Address:</strong> {leadAddress || "Not specified"}
              </p>
              {claimNumber && (
                <p className="text-sm text-gray-700">
                  <strong>Claim #:</strong> {claimNumber}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractor-phone" className="text-gray-900">
              Contractor Phone Number *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="contractor-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={contractorPhone}
                onChange={(e) => setContractorPhone(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                disabled={isSubmitting}
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              The contractor will receive a notification to access the camera app
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-900">
              Instructions (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions for the contractor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Assign Photo Job
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
