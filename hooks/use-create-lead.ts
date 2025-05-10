"use client"

import { useState } from "react"
import { createLeadAction } from "@/app/actions/lead-actions"
import type { Lead } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useSWRConfig } from "swr"

type CreateLeadInput = {
  fullName: string
  email: string
  phone: string
  address: string
  status: string
}

export function useCreateLead() {
  const { mutate } = useSWRConfig()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      // Check for success explicitly and use result.message for error
      if (!result.success) {
        throw new Error(result.message || "Failed to create lead.")
      }

      // If success is true, lead should be present as per createLeadAction's success return type
      if (!result.lead) {
        // This case should ideally not be reached if success is true and action is correct
        throw new Error("Lead creation was successful but did not return a lead object.")
      }

      // Assuming SWR is used, mutate relevant keys
      mutate("/api/leads") // Example SWR key
      router.push(`/leads/${result.lead.id}`)
      return result.lead
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      // Re-throw the error if you want calling code to also be able to catch it
      // Or handle it here (e.g., show a toast notification)
      throw new Error(errorMessage) // Re-throw to ensure Promise<Lead> is not violated on error
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
