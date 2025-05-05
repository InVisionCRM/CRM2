"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Lead } from "@prisma/client"

// Define the type for the update data, allowing partial updates
type UpdateLeadData = Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> & { leadId?: string }>

// Removed the old status mapping, as the source of truth should be the prisma enum
// const statusMapping: { [key: string]: string } = {
//   new: "SIGNED_CONTRACT",
//   contacted: "SCHEDULED",
//   qualified: "COLORS",
//   proposal: "ACV",
//   negotiation: "JOB",
//   closed_won: "COMPLETED_JOBS",
//   closed_lost: "DENIED",
// }

interface UseUpdateLeadResult {
  updateLead: (leadId: string, data: UpdateLeadData) => Promise<void>
  isLoading: boolean
  error: Error | null
}

export function useUpdateLead(): UseUpdateLeadResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateLead = useCallback(async (leadId: string, data: UpdateLeadData) => {
    setIsLoading(true)
    setError(null)
    
    // If status is being updated, ensure it uses the correct enum value (lowercase)
    // No mapping needed if the input `data.status` already matches the enum.
    // If mapping was intended for some other reason, it needs to be clarified.

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let result
        try {
          result = await response.json()
        } catch (e) {
          // Handle cases where the response is not JSON
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
        throw new Error(result.message || "Failed to update lead")
      }

      toast.success("Lead updated successfully")
    } catch (err: unknown) {
      console.error("Failed to update lead:", err)
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      toast.error("Failed to update lead")
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateLead, isLoading, error }
}
