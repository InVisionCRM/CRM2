"use client"

import { useState, useCallback } from "react"
import { useLeads } from "@/hooks/use-leads"
import { LeadsList } from "@/components/leads-list"
import { Skeleton } from "@/components/ui/skeleton"
import type { StatusCount } from "@/types/dashboard"
import { UserFilter, type UserOption } from "@/components/user-filter"
import { StatusGrid } from "@/components/status-grid"
import { LeadStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { LeadsDrawer } from "@/components/leads-drawer"
const mockUsers: UserOption[] = [
  { id: "user1", name: "John Smith" },
  { id: "user2", name: "Jane Doe" },
  { id: "user3", name: "Robert Johnson" },
  { id: "user4", name: "Emily Davis" },
]

function LeadsLoading() {
  return (
    <div className="space-y-3 py-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export default function LeadsClient() {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const { leads, isLoading, error } = useLeads({ status: selectedStatus })

  const statusCounts: StatusCount[] = [
    {
      status: "signed_contract",
      count: leads.filter((lead) => lead.status === "signed_contract").length,
      color: "border-blue-500",
      borderColor: "border-blue-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/Signed-Contract-YymWy953WCStBonHJV4Ags1GZZnRgZ.png",
    },
    {
      status: "scheduled",
      count: leads.filter((lead) => lead.status === "scheduled").length,
      color: "border-blue-500",
      borderColor: "border-blue-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/Scheduled-0wiyJ7ynJ81HasqBzYPklcXByysAUP.png",
    },
    {
      status: "colors",
      count: leads.filter((lead) => lead.status === "colors").length,
      color: "border-indigo-500",
      borderColor: "border-indigo-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/colors-DBitQFEELepnwDxeeDBoCqKoXcRwNO.png",
    },
    {
      status: "acv",
      count: leads.filter((lead) => lead.status === "acv").length,
      color: "border-purple-500",
      borderColor: "border-purple-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/acv-xBRM3B9fD3tTeWwu2qqC2IBR7mLA98.png",
    },
    {
      status: "job",
      count: leads.filter((lead) => lead.status === "job").length,
      color: "border-orange-500",
      borderColor: "border-orange-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/job-YcMjwzDLpiItcohAiG7ilRQzXocUOh.png",
    },
    {
      status: "completed_jobs",
      count: leads.filter((lead) => lead.status === "completed_jobs").length,
      color: "border-green-500",
      borderColor: "border-green-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/job-completed-M3sT1rLN0jZa8z386aqPK8NNjlguPh.png",
    },
    {
      status: "zero_balance",
      count: leads.filter((lead) => lead.status === "zero_balance").length,
      color: "border-green-500",
      borderColor: "border-green-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/zero-balance-0c8qigPnLMX1ls6nfyoOXQuzxSq3eG.png",
    },
    {
      status: "denied",
      count: leads.filter((lead) => lead.status === "denied").length,
      color: "border-red-500",
      borderColor: "border-red-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/denied-sozqLkPt6Pe2MnEQWyhJIMmFg0InCb.png",
    },
    {
      status: "follow_ups",
      count: leads.filter((lead) => lead.status === "follow_ups").length,
      color: "border-yellow-500",
      borderColor: "border-yellow-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/follow-up-vgb8yPL09PsiEjOWRGOXb1ZcOerKdP.png",
    },
  ]

  if (error) return <p className="text-red-600">Error: {error.message}</p>

  const handleStatusClick = (status: LeadStatus | null) => {
    setSelectedStatus(status)
  }

  const filteredLeads = selectedUser ? leads.filter((lead) => lead.assignedTo === selectedUser) : leads

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Active Leads</h1>
        <div className="w-full sm:w-auto">
          <UserFilter users={mockUsers} selectedUser={selectedUser} onUserChange={setSelectedUser} />
        </div>
      </div>

      <StatusGrid onStatusClick={handleStatusClick} activeStatus={selectedStatus} statusCounts={statusCounts} />

      <div className="mt-6">
        {isLoading ? (
          <LeadsLoading />
        ) : (
          <LeadsList leads={filteredLeads} isLoading={isLoading} assignedTo={selectedUser} />
        )}
      </div>
    </div>
  )
}
