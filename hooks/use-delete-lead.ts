"use client"

import { useState } from "react"

export function useDeleteLead() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteLead = async (leadId: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete lead")
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    deleteLead,
    isLoading,
    error,
  }
}
