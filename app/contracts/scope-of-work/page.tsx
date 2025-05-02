import { ContractForm } from "@/components/contracts/contract-form"
import { getLeadById } from "@/lib/db/leads"
import { notFound } from "next/navigation"

interface ScopeOfWorkPageProps {
  searchParams: {
    leadId?: string
  }
}

export default async function ScopeOfWorkPage({ searchParams }: ScopeOfWorkPageProps) {
  let lead = null

  // If a leadId is provided in the URL, fetch the lead data
  if (searchParams.leadId) {
    lead = await getLeadById(searchParams.leadId)

    if (!lead) {
      notFound()
    }
  }

  return (
    <div className="container mx-auto py-8">
      <ContractForm lead={lead} />
    </div>
  )
}
