"use client"

import { useState, useEffect } from "react"
import type { LeadSummary } from "@/types/dashboard"
import { LeadStatus } from "@prisma/client"

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

        // Debug the data received from the API
        console.log("Raw lead data from API:", data.slice(0, 2))
        
        // Transform the data to match LeadSummary type if needed
        const transformedLeads: LeadSummary[] = data.map((lead: any) => {
          console.log("Lead data:", {
            assignedToId: lead.assignedToId,
            assignedTo: lead.assignedTo
          })
          
          // Get salesperson info from the assignedTo relationship if available
          const salesperson = lead.assignedTo ? {
            id: lead.assignedTo.id,
            name: lead.assignedTo.name,
            email: lead.assignedTo.email
          } : null;
          
          // Get the latest activity if available
          const latestActivity = lead.activities && lead.activities.length > 0 
            ? {
                title: lead.activities[0].title,
                createdAt: lead.activities[0].createdAt,
                type: lead.activities[0].type
              }
            : null;
          
          return {
            id: lead.id,
            name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
            address: lead.address || "",
            phone: lead.phone || "",
            email: lead.email || "",
            status: lead.status && typeof lead.status === 'string' 
                      ? lead.status.toLowerCase() 
                      : 'unknown',
            appointmentDate: lead.adjusterAppointmentDate || null,
            assignedTo: salesperson ? salesperson.name : null,
            assignedToId: lead.assignedToId || null,
            createdAt: lead.createdAt,
            latestActivity
          }
        })

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
