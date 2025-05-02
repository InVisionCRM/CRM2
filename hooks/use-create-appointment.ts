"use client"

import { useState } from "react"
import type { Appointment, AppointmentFormData } from "@/types/appointments"

export function useCreateAppointment() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createAppointment = async (appointmentData: AppointmentFormData): Promise<Appointment | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create appointment")
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
    createAppointment,
    isLoading,
    error,
  }
}
