"use client"

import { useState } from "react"
import { createLeadAction } from "@/app/actions/lead-actions"
import type { Lead } from "@/types/lead"

type CreateLeadInput = {
  fullName: string
  email: string
  phone: string
  address: string
  status: string
}

export function useCreateLead() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createLead = async (leadData: CreateLeadInput): Promise<Lead> => {
    setIsLoading(true)
    setError(null)

    try {
      // Split fullName into first_name and last_name
      const nameParts = leadData.fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ""
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

      // Call the server action directly
      const result = await createLeadAction({
        firstName,
        lastName,
        email: leadData.email,
        phone: leadData.phone,
        address: leadData.address,
        status: mapStatusToApiFormat(leadData.status),
      })

      if (!result.success) {
        throw new Error(result.message || "Failed to create lead")
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
    createLead,
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
