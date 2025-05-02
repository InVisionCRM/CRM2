"use client"

import { useState } from "react"
import type { Appointment, AppointmentFormData } from "@/types/appointments"

export function useUpdateAppointment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateAppointment = async (
    id: string,
    appointmentData: Partial<AppointmentFormData>,
  ): Promise<Appointment | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update appointment")
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    updateAppointment,
    isLoading,
    error,
  }
}
