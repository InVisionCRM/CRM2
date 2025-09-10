"use client"

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import ScopeOfWorkForm from '@/components/forms/ScopeOfWorkForm'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Lead } from '@prisma/client'

interface ScopeOfWorkDialogProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScopeOfWorkDialog({ lead, open, onOpenChange }: ScopeOfWorkDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState<Record<string, any> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    // Collect form data
    const formDataObj = new FormData(event.currentTarget)
    const data: Record<string, any> = {}

    // Convert FormData to object, handling checkboxes properly
    for (const [key, value] of formDataObj.entries()) {
      if (data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          data[key].push(value)
        } else {
          data[key] = [data[key], value]
        }
      } else {
        data[key] = value
      }
    }

    // List of all checkbox field names (update as needed)
    const checkboxFields = [
      'ventilation_existing', 'addingYes', 'guttersDownspouts', 'guttersNone',
      'gutterSizeStandard', 'gutterSizeOverSized', 'gutterGuardsYes', 'gutterGuardsNo',
      'warrantyYes', 'warrantyNo', 'shutterReset', 'shutterReplace', 'shutterRemove', 'shutterNA',
      'facia', 'soffit', 'wraps', 'sidingNo', 'solarOwned', 'solarLeased',
      'critterYes', 'critterNo', 'critterUnknown', 'dishKeep', 'dishDispose', 'dishNone',
      'detachedYes', 'detachedNo', 'detachedWorkYes', 'detachedWorkNo', 'detachedWorkTBD',
      'drivewayDamage', 'miscDescription'
    ]

    // Transform checkboxes: checked = '✓', unchecked = ''
    checkboxFields.forEach(field => {
      if (data[field] !== undefined) {
        data[field] = data[field] === 'on' || data[field] === true ? '✓' : ''
      }
    })

    // Convert number fields
    if (data.numberPanels) {
      data.numberPanels = parseInt(data.numberPanels as string, 10)
    }

    // Add leadId to the data
    if (lead?.id) {
      data.leadId = lead.id
    }

    setFormData(data)
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = async () => {
    if (!formData) return
    
    setIsSubmitting(true)
    setShowConfirmation(false)

    try {
      const response = await fetch('/api/docuseal/scope-of-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit scope of work')
      }

      const result = await response.json()
      console.log('✅ Scope of work submitted successfully:', result)
      
      // Show success toast with clear message
      toast({
        title: "🎉 Document Successfully Sent!",
        description: `The Scope of Work document has been sent to your client at ${result.email || lead?.email}. They will receive an email with the contract for review and signature.`,
        duration: 5000,
      })
      
      // Reset form using the ref
      if (formRef.current) {
        formRef.current.reset()
      }
      
      // Close dialog after successful submission
      setTimeout(() => {
        onOpenChange(false)
        setFormData(null)
      }, 2000)
      
    } catch (error) {
      console.error('❌ Error submitting scope of work:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
    setFormData(null)
  }

  const prefilledData = {
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    address: lead?.address || '',
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scope of Work</DialogTitle>
          </DialogHeader>
          
          <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-6">
            <ScopeOfWorkForm prefilledData={prefilledData} />
            
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Scope of Work'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Scope of Work Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this Scope of Work? This will send the document to the client and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmation}>
              Go Back to Edit
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-white text-green-600 hover:bg-green-600 text-white">
              Confirm & Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 