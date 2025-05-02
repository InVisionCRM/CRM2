"use client"

import { useState, useEffect } from "react"
import type { Lead } from "@/types/lead"

interface UseLeadResult {
  lead: Lead | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useLead(id: string): UseLeadResult {
  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    const fetchLead = async () => {
      if (!id) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/leads/${id}`)

        if (!response.ok) {
          throw new Error(`Error fetching lead: ${response.statusText}`)
        }

        const data = await response.json()
        setLead(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        console.error("Error fetching lead:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLead()
  }, [id, refreshKey])

  const refetch = () => setRefreshKey((prev) => prev + 1)

  return { lead, isLoading, error, refetch }
}
