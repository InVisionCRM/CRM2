"use client"

import { useState } from "react"
import type { Lead } from "@/types/lead"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Phone, Mail, DollarSign, Calendar, Hammer, FileText } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

interface LeadInsuranceProps {
  lead: Lead
}

const insuranceSchema = z.object({
  insuranceCompany: z.string().optional().nullable(),
  insurancePhone: z.string().optional().nullable(),
  insuranceSecondaryPhone: z.string().optional().nullable(),
  dateOfLoss: z.string().optional().nullable(),
  damageType: z.string().optional().nullable(),
  claimNumber: z.string().optional().nullable()
})

export function LeadInsurance({ lead }: LeadInsuranceProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    insuranceCompany: lead.insuranceCompany || "",
    insurancePhone: lead.insurancePhone || "",
    insuranceSecondaryPhone: lead.insuranceSecondaryPhone || "",
    dateOfLoss: lead.dateOfLoss ? new Date(lead.dateOfLoss).toISOString().split('T')[0] : "",
    damageType: lead.damageType || "",
    claimNumber: lead.claimNumber || ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    try {
      insuranceSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/leads/${lead.id}/insurance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update insurance information")
      }
      
      toast.success("Insurance information updated successfully")
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderDetail(label: string, value: string | number | null | undefined, Icon?: React.ElementType) {
    if (!value) return null
    return (
      <div className="space-y-1">
        <h3 className="text-xs font-medium text-muted-foreground flex items-center">
          {Icon && <Icon className="h-3 w-3 mr-2" />}
          {label}
        </h3>
        <p className="text-sm">{typeof value === 'number' ? `$${value}` : value}</p>
      </div>
    )
  }

  if (isEditing) {
    return (
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Insurance Company</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceCompany">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="insuranceCompany"
                      name="insuranceCompany"
                      value={formData.insuranceCompany}
                      onChange={handleInputChange}
                      placeholder="Insurance Company"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimNumber">Claim Number</Label>
                  <Input
                    id="claimNumber"
                    name="claimNumber"
                    value={formData.claimNumber}
                    onChange={handleInputChange}
                    placeholder="Claim Number"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Insurance Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurancePhone">Primary Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="insurancePhone"
                      name="insurancePhone"
                      value={formData.insurancePhone}
                      onChange={handleInputChange}
                      placeholder="Primary Phone"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insuranceSecondaryPhone">Secondary Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="insuranceSecondaryPhone"
                      name="insuranceSecondaryPhone"
                      value={formData.insuranceSecondaryPhone}
                      onChange={handleInputChange}
                      placeholder="Secondary Phone"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Claim Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfLoss">Date of Loss</Label>
                  <Input
                    id="dateOfLoss"
                    name="dateOfLoss"
                    type="date"
                    value={formData.dateOfLoss}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="damageType">Damage Type</Label>
                  <Select
                    value={formData.damageType}
                    onValueChange={(value) => handleSelectChange("damageType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select damage type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="HAIL">Hail</SelectItem>
                      <SelectItem value="WIND">Wind</SelectItem>
                      <SelectItem value="FIRE">Fire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-4 py-3 flex justify-end gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Insurance Information</h2>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      </div>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {renderDetail("Company", lead.insuranceCompany, Building2)}
        {renderDetail("Primary Phone", lead.insurancePhone, Phone)}
        {renderDetail("Secondary Phone", lead.insuranceSecondaryPhone, Phone)}
        {renderDetail(
          "Date of Loss", 
          lead.dateOfLoss ? new Date(lead.dateOfLoss).toLocaleDateString() : null, 
          Calendar
        )}
        {renderDetail("Damage Type", lead.damageType, Hammer)}
        {renderDetail("Claim #", lead.claimNumber, FileText)}
      </CardContent>
    </Card>
  )
} 