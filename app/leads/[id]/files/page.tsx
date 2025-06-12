import { Suspense } from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { FileManagerPage } from "@/components/leads/file-manager-page"
import { Loader2 } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getLeadData(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      claimNumber: true,
      status: true,
    }
  })

  if (!lead) {
    notFound()
  }

  return lead
}

export default async function FilesPage({ params }: PageProps) {
  const { id } = await params
  const lead = await getLeadData(id)

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <FileManagerPage lead={lead} />
      </Suspense>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const lead = await getLeadData(id)
  
  return {
    title: `Files - ${lead.firstName} ${lead.lastName}`,
    description: `File management for ${lead.firstName} ${lead.lastName}`,
  }
} 