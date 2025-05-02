"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import Image from "next/image"
import { usePropertyDetails } from "@/hooks/use-property-details"
import { PropertyDetailsForm } from "@/components/leads/property-details-form"
import type { PropertyDetails } from "@/types/lead"

interface LeadPropertyDetailsProps {
  leadId: string
}

export function LeadPropertyDetails({ leadId }: LeadPropertyDetailsProps) {
  const { propertyDetails, isLoading, error, updatePropertyDetails } = usePropertyDetails(leadId)
  const [isEditing, setIsEditing] = useState(false)

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCloseForm = () => {
    setIsEditing(false)
  }

  const handleSubmit = async (data: Partial<PropertyDetails>) => {
    await updatePropertyDetails(data)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <CardHeader className="pb-2 bg-gray-50">
          <CardTitle className="text-lg font-semibold">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">Loading property details...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <CardHeader className="pb-2 bg-gray-50">
          <CardTitle className="text-lg font-semibold">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">Error loading property details. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!propertyDetails) {
    return (
      <Card className="overflow-hidden border border-gray-200 shadow-sm">
        <CardHeader className="pb-2 bg-gray-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Property Details</CardTitle>
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              Add Details
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col justify-center items-center h-40 space-y-2">
            <p className="text-muted-foreground">No property details available.</p>
            <p className="text-sm text-muted-foreground">Click "Add Details" to add property information.</p>
          </div>
          <PropertyDetailsForm
            isOpen={isEditing}
            onClose={handleCloseForm}
            initialData={null}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm">
      <CardHeader className="pb-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Property Details</CardTitle>
          <div className="flex items-center space-x-2.5">
            <Button
              className="p-0 h-[50px] w-[175px] bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
              onClick={() => window.open("https://www.eagleview.com", "_blank")}
            >
              <Image
                src="/images/eagleview-logo.png"
                alt="EagleView"
                width={175}
                height={50}
                className="object-contain"
              />
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleEditClick}>
              <span className="hidden sm:inline">Edit</span>
              <span className="sm:hidden">
                <Pencil size={16} />
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Roof Type</p>
            <p className="font-medium text-gray-900">{propertyDetails.roofType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Roof Age</p>
            <p className="font-medium text-gray-900">
              {propertyDetails.roofAge ? `${propertyDetails.roofAge} years` : "Unknown"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Square Footage</p>
            <p className="font-medium text-gray-900">
              {propertyDetails.squareFootage ? `${propertyDetails.squareFootage.toLocaleString()} sq ft` : "Unknown"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Stories</p>
            <p className="font-medium text-gray-900">{propertyDetails.stories}</p>
          </div>
        </div>

        <div className="pt-1 border-t border-gray-100">
          <p className="text-sm font-medium text-muted-foreground mb-2">Damage Information</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={propertyDetails.hasExistingDamage ? "default" : "outline"}
              className={propertyDetails.hasExistingDamage ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}
            >
              {propertyDetails.hasExistingDamage ? "Existing Damage" : "No Damage Reported"}
            </Badge>
            {propertyDetails.damageType && (
              <Badge variant="outline" className="border-amber-200 text-amber-800">
                {propertyDetails.damageType}
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-1 border-t border-gray-100">
          <p className="text-sm font-medium text-muted-foreground mb-2">Insurance Information</p>
          {propertyDetails.insuranceClaim ? (
            <div className="space-y-3">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Insurance Claim</Badge>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Insurance Company</p>
                  <p className="font-medium text-gray-900">{propertyDetails.insuranceCompany}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Claim Number</p>
                  <p className="font-medium text-gray-900 font-mono">{propertyDetails.claimNumber}</p>
                </div>
              </div>
            </div>
          ) : (
            <Badge variant="outline" className="border-gray-200">
              No Insurance Claim
            </Badge>
          )}
        </div>
      </CardContent>
      <PropertyDetailsForm
        isOpen={isEditing}
        onClose={handleCloseForm}
        initialData={propertyDetails}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
      />
    </Card>
  )
}
