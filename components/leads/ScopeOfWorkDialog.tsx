"use client"

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import ScopeOfWorkForm from '@/components/forms/ScopeOfWorkForm'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { buildScopeOfWorkPayload } from '@/lib/scope-of-work-form'
import { ContractSentDialog, type ContractSentResult } from '@/components/contracts/ContractSentDialog'
import { ScopeOfWorkReview, type ScopeOfWorkDraft } from '@/components/scope-of-work/ScopeOfWorkReview'
import type { Lead } from '@prisma/client'

interface ScopeOfWorkDialogProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScopeOfWorkDialog({ lead, open, onOpenChange }: ScopeOfWorkDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState<ContractSentResult | null>(null)
  const [draft, setDraft] = useState<ScopeOfWorkDraft | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState<Record<string, any> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const data = buildScopeOfWorkPayload(event.currentTarget, lead?.id)

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

      const draft: ScopeOfWorkDraft = await response.json()

      // Close the form and hand the rep the real document to approve.
      onOpenChange(false)
      setFormData(null)
      formRef.current?.reset()
      setDraft(draft)

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
      <ContractSentDialog result={sent} onClose={() => setSent(null)} />

      <ScopeOfWorkReview
        draft={draft}
        onSent={(result) => { setDraft(null); setSent(result) }}
        onDiscarded={() => setDraft(null)}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-auto sm:max-h-[90vh] sm:w-auto sm:max-w-4xl sm:rounded-lg sm:border">
          <DialogHeader className="shrink-0 border-b px-4 py-3 text-left sm:px-6">
            <DialogTitle className="text-[17px]">Scope of Work</DialogTitle>
          </DialogHeader>

          <form
            ref={formRef}
            onSubmit={handleFormSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* the form scrolls; the actions stay reachable */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              <ScopeOfWorkForm prefilledData={prefilledData} />
            </div>

            <div className="shrink-0 gap-2 border-t bg-background px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 sm:px-6 flex">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="min-h-[48px] px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[48px] flex-1 bg-green-600 text-white hover:bg-green-800"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing preview...
                  </>
                ) : (
                  'Review & send'
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
            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-white text-black hover:bg-green-600 hover:text-white">
              Confirm & Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 