"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { PropertyDetails } from "@/types/lead"

interface UsePropertyDetailsResult {
  propertyDetails: PropertyDetails | null
  isLoading: boolean
  error: Error | null
  updatePropertyDetails: (data: Partial<PropertyDetails>) => Promise<void>
  refetch: () => void
}

export function usePropertyDetails(leadId: string): UsePropertyDetailsResult {
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!leadId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/leads/${leadId}/property-details`)

        if (!response.ok) {
          if (response.status === 404) {
            // Property details not found, but this is not an error
            setPropertyDetails(null)
            setIsLoading(false)
            return
          }
          throw new Error(`Error fetching property details: ${response.statusText}`)
        }

        const data = await response.json()
        setPropertyDetails(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        console.error("Error fetching property details:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropertyDetails()
  }, [leadId, refreshKey])

  const updatePropertyDetails = async (data: Partial<PropertyDetails>) => {
    if (!leadId) return

    setIsLoading(true)
    setError(null)

    try {
      const method = propertyDetails ? "PUT" : "POST"
      const response = await fetch(`/api/leads/${leadId}/property-details`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Error updating property details: ${response.statusText}`)
      }

      const updatedData = await response.json()
      setPropertyDetails(updatedData)

      toast({
        title: "Success",
        description: "Property details updated successfully",
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      console.error("Error updating property details:", err)

      toast({
        title: "Error",
        description: "Failed to update property details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = () => setRefreshKey((prev) => prev + 1)

  return { propertyDetails, isLoading, error, updatePropertyDetails, refetch }
}
