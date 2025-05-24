"use client"

import { useMemo, useState } from "react"
import { useLeads } from "@/hooks/use-leads"
import { LeadsList } from "@/components/leads-list"
import { Skeleton } from "@/components/ui/skeleton"
import type { StatusCount, LeadSummary } from "@/types/dashboard"
import { StatusGrid } from "@/components/status-grid"
import { LeadStatus } from "@prisma/client"
import type { SortOptions } from "@/app/leads/page"

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

interface LeadsClientProps {
  searchQuery?: string;
  sortOptions: SortOptions;
  selectedUser: string | null;
}

export default function LeadsClient({ 
  searchQuery = "", 
  sortOptions, 
  selectedUser 
}: LeadsClientProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null)
  const { leads, isLoading, error } = useLeads({ status: selectedStatus })

  const statusCounts: StatusCount[] = useMemo(() => [
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
  ], [leads])

  if (error) return <p className="text-red-600">Error: {error.message}</p>

  const handleStatusClick = (status: LeadStatus | null) => {
    setSelectedStatus(status)
  }

  const processedLeads = useMemo(() => {
    let tempLeads: LeadSummary[] = [...leads];

    if (selectedUser) {
      tempLeads = tempLeads.filter((lead) => lead.assignedToId === selectedUser);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      tempLeads = tempLeads.filter((lead) => {
        const nameMatch = lead.name?.toLowerCase().startsWith(query);
        const emailMatch = lead.email?.toLowerCase().startsWith(query);
        return nameMatch || emailMatch;
      });
    }

    if (sortOptions.field) {
      tempLeads.sort((a, b) => {
        const fieldA = a[sortOptions.field as keyof LeadSummary];
        const fieldB = b[sortOptions.field as keyof LeadSummary];

        let comparison = 0;
        if (fieldA === null || typeof fieldA === 'undefined') comparison = -1;
        else if (fieldB === null || typeof fieldB === 'undefined') comparison = 1;
        else if (fieldA > fieldB) comparison = 1;
        else if (fieldA < fieldB) comparison = -1;
        
        return sortOptions.order === "desc" ? comparison * -1 : comparison;
      });
    }

    return tempLeads;
  }, [leads, selectedUser, searchQuery, sortOptions]);


  return (
    <div className="space-y-6">
      <StatusGrid onStatusClick={handleStatusClick} activeStatus={selectedStatus} statusCounts={statusCounts} />

      <div className="mt-6">
        {isLoading ? (
          <LeadsLoading />
        ) : processedLeads.length === 0 ? (
          <div className="text-center py-10 border rounded-lg">
            <p className="text-muted-foreground">No leads found matching your criteria.</p>
            {(searchQuery || selectedStatus || selectedUser) && (
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search terms or filters.
              </p>
            )}
          </div>
        ) : (
          <LeadsList leads={processedLeads} isLoading={isLoading} assignedTo={selectedUser} />
        )}
      </div>
    </div>
  )
}
