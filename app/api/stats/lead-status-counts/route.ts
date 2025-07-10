import { NextResponse } from 'next/server'
import { PrismaClient, LeadStatus } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get counts for each status
    const statusCounts = await Promise.all(
      Object.values(LeadStatus).map(async (status) => {
        const count = await prisma.lead.count({
          where: { status }
        })
        return {
          status,
          count,
          label: formatStatusLabel(status)
        }
      })
    )

    return NextResponse.json({ statusCounts })
  } catch (error) {
    console.error('Error fetching lead status counts:', error)
    return NextResponse.json({ error: 'Failed to fetch lead status counts' }, { status: 500 })
  }
}

function formatStatusLabel(status: LeadStatus): string {
  switch (status) {
    case LeadStatus.signed_contract:
      return "Signed Contract"
    case LeadStatus.scheduled:
      return "Scheduled"
    case LeadStatus.colors:
      return "Colors"
    case LeadStatus.acv:
      return "ACV"
    case LeadStatus.job:
      return "Job"
    case LeadStatus.completed_jobs:
      return "Completed Jobs"
    case LeadStatus.zero_balance:
      return "Zero Balance"
    case LeadStatus.denied:
      return "Denied"
    case LeadStatus.follow_ups:
      return "Follow Ups"
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
} 