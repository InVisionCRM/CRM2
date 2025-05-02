// hooks/use‑insurance-info.ts
"use client"

import { useState, useEffect } from "react"
import type { InsuranceInfo } from "@/components/leads/insurance-info-card"

interface UseInsuranceInfoResult {
  insuranceInfo: InsuranceInfo | null
  isLoading: boolean
  error: string | null
  saveInsurance: (data: InsuranceInfo) => Promise<boolean>
}

export function useInsuranceInfo(leadId?: string): UseInsuranceInfoResult {
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!!leadId)
  const [error, setError] = useState<string | null>(null)

  // Load existing insurance info when leadId changes
  useEffect(() => {
    if (!leadId) {
      setInsuranceInfo(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    fetch(`/api/insurance/${leadId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`)
        return res.json() as Promise<InsuranceInfo>
      })
      .then((data) => {
        setInsuranceInfo(data)
      })
      .catch((err) => {
        console.error("Failed to load insurance info:", err)
        setError(err.message || "Failed to load insurance info")
      })
      .finally(() => setIsLoading(false))
  }, [leadId])

  // Create or update insurance info
  const saveInsurance = async (data: InsuranceInfo): Promise<boolean> => {
    if (!leadId) {
      setError("No lead ID provided")
      return false
    }
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/insurance/${leadId}`, {
        method: insuranceInfo ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.message || `Status ${res.status}`)
      }
      const saved = (await res.json()) as InsuranceInfo
      setInsuranceInfo(saved)
      return true
    } catch (err: any) {
      console.error("Failed to save insurance info:", err)
      setError(err.message || "Failed to save insurance info")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { insuranceInfo, isLoading, error, saveInsurance }
}
