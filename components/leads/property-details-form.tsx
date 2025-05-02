"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { PropertyDetails } from "@/types/lead"

interface PropertyDetailsFormProps {
  isOpen: boolean
  onClose: () => void
  initialData: Partial<PropertyDetails> | null
  onSubmit: (data: Partial<PropertyDetails>) => Promise<void>
  isSubmitting: boolean
}

export function PropertyDetailsForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
}: PropertyDetailsFormProps) {
  const [formData, setFormData] = useState<Partial<PropertyDetails>>(
    initialData || {
      roofType: "",
      roofAge: undefined,
      squareFootage: undefined,
      stories: 1,
      hasExistingDamage: false,
      damageType: "",
      insuranceClaim: false,
      insuranceCompany: "",
      claimNumber: "",
    },
  )

  const handleChange = (field: keyof PropertyDetails, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Property Details" : "Add Property Details"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roofType">Roof Type</Label>
              <Select value={formData.roofType} onValueChange={(value) => handleChange("roofType", value)}>
                <SelectTrigger id="roofType">
                  <SelectValue placeholder="Select roof type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asphalt Shingle">Asphalt Shingle</SelectItem>
                  <SelectItem value="Metal">Metal</SelectItem>
                  <SelectItem value="Tile">Tile</SelectItem>
                  <SelectItem value="Slate">Slate</SelectItem>
                  <SelectItem value="Wood Shake">Wood Shake</SelectItem>
                  <SelectItem value="Flat/Built-Up">Flat/Built-Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roofAge">Roof Age (years)</Label>
              <Input
                id="roofAge"
                type="number"
                min="0"
                value={formData.roofAge || ""}
                onChange={(e) => handleChange("roofAge", Number.parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="squareFootage">Square Footage</Label>
              <Input
                id="squareFootage"
                type="number"
                min="0"
                value={formData.squareFootage || ""}
                onChange={(e) => handleChange("squareFootage", Number.parseInt(e.target.value) || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stories">Stories</Label>
              <Select
                value={formData.stories?.toString()}
                onValueChange={(value) => handleChange("stories", Number.parseInt(value))}
              >
                <SelectTrigger id="stories">
                  <SelectValue placeholder="Select number of stories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hasExistingDamage">Has Existing Damage</Label>
              <Switch
                id="hasExistingDamage"
                checked={formData.hasExistingDamage}
                onCheckedChange={(checked) => handleChange("hasExistingDamage", checked)}
              />
            </div>
          </div>

          {formData.hasExistingDamage && (
            <div className="space-y-2">
              <Label htmlFor="damageType">Damage Type</Label>
              <Select value={formData.damageType || ""} onValueChange={(value) => handleChange("damageType", value)}>
                <SelectTrigger id="damageType">
                  <SelectValue placeholder="Select damage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hail">Hail</SelectItem>
                  <SelectItem value="Wind">Wind</SelectItem>
                  <SelectItem value="Water">Water</SelectItem>
                  <SelectItem value="Fire">Fire</SelectItem>
                  <SelectItem value="Structural">Structural</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="insuranceClaim">Insurance Claim</Label>
              <Switch
                id="insuranceClaim"
                checked={formData.insuranceClaim}
                onCheckedChange={(checked) => handleChange("insuranceClaim", checked)}
              />
            </div>
          </div>

          {formData.insuranceClaim && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceCompany">Insurance Company</Label>
                <Input
                  id="insuranceCompany"
                  value={formData.insuranceCompany || ""}
                  onChange={(e) => handleChange("insuranceCompany", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimNumber">Claim Number</Label>
                <Input
                  id="claimNumber"
                  value={formData.claimNumber || ""}
                  onChange={(e) => handleChange("claimNumber", e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
