"use client"

import { useState } from "react"

export function useDeleteAppointment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteAppointment = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete appointment")
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    deleteAppointment,
    isLoading,
    error,
  }
}
