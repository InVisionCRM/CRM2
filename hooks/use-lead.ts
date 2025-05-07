"use client"

import useSWR from "swr"
import type { Lead } from "@prisma/client"

interface UseLeadResult {
  lead: Lead | null
  isLoading: boolean
  error: Error | null
  mutate: () => void
}

const fetcher = async (url: string): Promise<Lead> => {
  const response = await fetch(url)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to fetch lead (${response.status})`)
  }
  
  return response.json()
}

export function useLead(id: string | undefined): UseLeadResult {
  const { data, error, mutate, isLoading } = useSWR<Lead>(
    id ? `/api/leads/${id}` : null,
    fetcher, 
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )
  
  return {
    lead: data || null,
    isLoading,
    error: error || null,
    mutate,
  }
}
