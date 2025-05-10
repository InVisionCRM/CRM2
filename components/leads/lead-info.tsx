"use client"

import { useState } from "react"
import type { LeadWithAssignedUser } from "@/types/lead"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { formatStatusLabel } from "@/lib/utils"

interface LeadInfoProps {
  lead: LeadWithAssignedUser
}

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export function LeadInfo({ lead }: LeadInfoProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: lead.firstName || "",
    lastName: lead.lastName || "",
    email: lead.email || "",
    phone: lead.phone || "",
    address: lead.address || "",
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

  const validateForm = () => {
    try {
      contactSchema.parse(formData)
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
      const response = await fetch(`/api/leads/${lead.id}/contact`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update contact information")
      }
      
      toast.success("Contact information updated successfully")
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEditing) {
    return (
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                  className="pl-10"
                />
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
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{lead.email || "No email provided"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{lead.phone || "No phone provided"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p>{lead.address || "No address provided"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Additional Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{formatStatusLabel(lead.status)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Loss</p>
              <p className="font-medium">
                {lead.dateOfLoss ? format(new Date(lead.dateOfLoss), "MM/dd/yyyy") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned To</p>
              <p className="font-medium">{lead.assignedTo?.name || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Damage Type</p>
              <p className="font-medium">{lead.damageType || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">
                {format(new Date(lead.createdAt), "MM/dd/yyyy, p")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 