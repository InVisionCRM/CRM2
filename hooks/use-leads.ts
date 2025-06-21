"use client"

import { useState, useEffect } from "react"
import type { LeadSummary } from "@/types/dashboard"
import { LeadStatus } from "@prisma/client"
import type { SortField, SortOrder } from "@/app/leads/page"

interface UseLeadsOptions {
  status?: LeadStatus | null
  assignedTo?: string | null
  search?: string
  sort?: SortField
  order?: SortOrder
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

  console.log("[useLeads] Hook called with options:", JSON.stringify(options));

  useEffect(() => {
    console.log("[useLeads] useEffect triggered. Dependencies:", JSON.stringify({
      status: options.status,
      assignedTo: options.assignedTo,
      search: options.search,
      sort: options.sort,
      order: options.order,
      refreshKey
    }));

    const fetchLeads = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const queryParams = new URLSearchParams()
        if (options.status) {
          queryParams.append("status", options.status)
        }
        if (options.assignedTo) {
          queryParams.append("assignedTo", options.assignedTo)
        }
        if (options.search) {
          queryParams.append("search", options.search)
        }
        if (options.sort) {
          queryParams.append("sort", options.sort)
        }
        if (options.order) {
          queryParams.append("order", options.order)
        }

        const url = `/api/leads?${queryParams.toString()}`
        console.log("[useLeads] Fetching URL:", url);
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Error fetching leads: ${response.statusText}`)
        }

        const data = await response.json()
        
        const transformedLeads: LeadSummary[] = data.map((lead: any) => {
          const salesperson = lead.assignedTo ? {
            id: lead.assignedTo.id,
            name: lead.assignedTo.name,
            email: lead.assignedTo.email
          } : null
          
          const latestActivity = lead.activities && lead.activities.length > 0 
            ? {
                title: lead.activities[0].title,
                createdAt: lead.activities[0].createdAt,
                type: lead.activities[0].type
              }
            : null
          
          return {
            id: lead.id,
            name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
            address: lead.address || "",
            phone: lead.phone || "",
            email: lead.email || "",
            status: lead.status && typeof lead.status === 'string' 
                      ? lead.status.toLowerCase() as LeadStatus
                      : LeadStatus.NEW_LEAD,
            appointmentDate: lead.adjusterAppointmentDate || null,
            assignedTo: salesperson ? salesperson.name : null,
            assignedToId: lead.assignedToId || null,
            claimNumber: lead.claimNumber || null,
            // Insurance fields
            insuranceCompany: lead.insuranceCompany || null,
            insurancePolicyNumber: lead.insurancePolicyNumber || null,
            insurancePhone: lead.insurancePhone || null,
            insuranceSecondaryPhone: lead.insuranceSecondaryPhone || null,
            insuranceDeductible: lead.insuranceDeductible || null,
            dateOfLoss: lead.dateOfLoss || null,
            damageType: lead.damageType || null,
            // Adjuster fields
            insuranceAdjusterName: lead.insuranceAdjusterName || null,
            insuranceAdjusterPhone: lead.insuranceAdjusterPhone || null,
            insuranceAdjusterEmail: lead.insuranceAdjusterEmail || null,
            adjusterAppointmentDate: lead.adjusterAppointmentDate || null,
            adjusterAppointmentTime: lead.adjusterAppointmentTime || null,
            adjusterAppointmentNotes: lead.adjusterAppointmentNotes || null,
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
  }, [options.status, options.assignedTo, options.search, options.sort, options.order, refreshKey])

  const refetch = () => setRefreshKey((prev) => prev + 1)

  return { leads, isLoading, error, refetch }
}
