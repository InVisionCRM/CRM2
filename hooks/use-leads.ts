"use client"

import { useState, useEffect } from "react"
import type { LeadSummary } from "@/types/dashboard"
import type { LeadStatus } from "@/types/dashboard"

interface UseLeadsOptions {
  status?: LeadStatus | null
}

interface UseLeadsResult {
  leads: LeadSummary[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useLeads(options: UseLeadsOptions = {}): UseLeadsResult {
  const [leads, setLeads] = useState<LeadSummary[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Build the URL with query parameters if status is provided
        let url = "/api/leads"
        if (options.status) {
          url += `?status=${options.status}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Error fetching leads: ${response.statusText}`)
        }

        const data = await response.json()

        // Transform the data to match LeadSummary type if needed
        const transformedLeads: LeadSummary[] = data.map((lead: any) => ({
          id: lead.id,
          name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
          address: lead.address || "",
          phone: lead.phone || "",
          email: lead.email || "",
          status: lead.status && typeof lead.status === 'string' 
                    ? lead.status.toLowerCase() 
                    : 'unknown',
          appointmentDate: lead.adjusterAppointmentDate || null,
          assignedTo: lead.assignedTo?.name || null,
          createdAt: lead.createdAt
        }))

        setLeads(transformedLeads)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        console.error("Error fetching leads:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeads()
  }, [options.status, refreshKey])

  const refetch = () => setRefreshKey((prev) => prev + 1)

  return { leads, isLoading, error, refetch }
}
