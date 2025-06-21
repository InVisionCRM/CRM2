"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { updateLeadAction } from "@/app/actions/lead-actions"
import { Loader2 } from "lucide-react"

interface InlineEditDialogProps {
  leadId: string
  field: "claimNumber" | "address" | "insuranceCompany" | "insurancePhone" | "adjusterName" | "adjusterPhone" | "adjusterEmail"
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InlineEditDialog({ leadId, field, isOpen, onClose, onSuccess }: InlineEditDialogProps) {
  const [value, setValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Map field names to database field names
      const fieldMapping: Record<string, string> = {
        adjusterName: 'insuranceAdjusterName',
        adjusterPhone: 'insuranceAdjusterPhone',
        adjusterEmail: 'insuranceAdjusterEmail',
      }
      
      const dbFieldName = fieldMapping[field] || field
      
      const result = await updateLeadAction(leadId, {
        [dbFieldName]: value
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Lead updated successfully"
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update lead",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getFieldLabel = () => {
    switch (field) {
      case "claimNumber":
        return "Claim Number"
      case "address":
        return "Address"
      case "insuranceCompany":
        return "Insurance Company"
      case "insurancePhone":
        return "Insurance Phone"
      case "adjusterName":
        return "Adjuster Name"
      case "adjusterPhone":
        return "Adjuster Phone"
      case "adjusterEmail":
        return "Adjuster Email"
      default:
        return field
    }
  }

  const fieldLabel = getFieldLabel()
  const inputType = field === "adjusterEmail" ? "email" : "text"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {fieldLabel}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field} className="text-right">
                {fieldLabel}
              </Label>
              <Input
                id={field}
                type={inputType}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="col-span-3"
                placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 