import { notFound } from "next/navigation"
import { getLeadById } from "@/lib/db/leads"
import { LeadDetail } from "@/components/leads/lead-detail"

interface LeadDetailPageProps {
  params: {
    id: string
  }
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  if (!params?.id) {
    return notFound()
  }

  const lead = await getLeadById(params.id)

  if (!lead) {
    return notFound()
  }

  return <LeadDetail lead={lead} />
}
