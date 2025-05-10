"use client"

import { useState, useEffect, useCallback } from "react"
import type { CalendarAppointment } from "@/types/appointments"

interface UseAppointmentsOptions {
  startDate?: Date
  endDate?: Date
  leadId?: string
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (options.startDate) {
        params.append("startDate", options.startDate.toISOString())
      }

      if (options.endDate) {
        params.append("endDate", options.endDate.toISOString())
      }

      if (options.leadId) {
        params.append("leadId", options.leadId)
      }

      const queryString = params.toString() ? `?${params.toString()}` : ""

      // Add timeout to fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`/api/appointments${queryString}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to fetch appointments"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If parsing fails, use the status text
          errorMessage = `${response.status}: ${response.statusText || errorMessage}`
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (err) {
      // Check if the error is an AbortError (fetch was cancelled)
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Fetch aborted");
        // Don't set error state if fetch was aborted
      } else {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      }

      // Return empty array on error
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }, [options.startDate, options.endDate, options.leadId])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments, retryCount])

  const retryFetch = () => {
    setRetryCount((prev) => prev + 1)
  }

  return {
    appointments,
    isLoading,
    error,
    refreshAppointments: retryFetch,
  }
}
