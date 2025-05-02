"use client"

import { useState, useEffect } from "react"
import type { Appointment } from "@/types/appointments"

export function useLeadAppointments(leadId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAppointments = async () => {
    if (!leadId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/leads/${leadId}/appointments`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch appointments")
      }

      const data = await response.json()
      setAppointments(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (leadId) {
      fetchAppointments()
    }
  }, [leadId])

  return {
    appointments,
    isLoading,
    error,
    refreshAppointments: fetchAppointments,
  }
}
