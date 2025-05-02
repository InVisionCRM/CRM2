"use client"

import { useState } from "react"
import { updateLeadAction } from "@/app/actions/lead-actions"
import type { Lead } from "@/types/lead"

type UpdateLeadInput = Partial<{
  fullName: string
  email: string
  phone: string
  address: string
  status: string
}>

export function useUpdateLead() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateLead = async (leadId: string, leadData: UpdateLeadInput): Promise<Lead> => {
    setIsLoading(true)
    setError(null)

    try {
      // Process fullName if provided
      let firstName: string | undefined
      let lastName: string | undefined

      if (leadData.fullName) {
        const nameParts = leadData.fullName.trim().split(/\s+/)
        firstName = nameParts[0] || ""
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""
      }

      // Call server action
      const result = await updateLeadAction(leadId, {
        firstName,
        lastName,
        email: leadData.email,
        phone: leadData.phone,
        address: leadData.address,
        status: leadData.status ? mapStatusToApiFormat(leadData.status) : undefined,
      })

      if (!result.success) {
        throw new Error(result.message || "Failed to update lead")
      }

      return result.lead
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    updateLead,
    isLoading,
    error,
  }
}

// Helper function to map form status values to API status values
function mapStatusToApiFormat(status: string): string {
  const statusMap: Record<string, string> = {
    new: "SIGNED_CONTRACT",
    contacted: "SCHEDULED",
    qualified: "COLORS",
    proposal: "ACV",
    negotiation: "JOB",
    closed_won: "COMPLETED_JOBS",
    closed_lost: "DENIED",
  }

  return statusMap[status] || "SIGNED_CONTRACT"
}
