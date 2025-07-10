import { NextResponse } from "next/server"
import { PrismaClient, LeadStatus, ActivityType } from "@prisma/client"
import { differenceInMinutes, differenceInHours, differenceInDays } from "date-fns"

const prisma = new PrismaClient()

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const minutes = differenceInMinutes(now, date)
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = differenceInHours(now, date)
  if (hours < 24) {
    return `${hours}h ago`
  }
  const days = differenceInDays(now, date)
  return `${days}d ago`
}

export async function GET() {
  try {
    const totalLeads = await prisma.lead.count()
    const totalJobsCompleted = await prisma.lead.count({
      where: { status: LeadStatus.completed_jobs },
    })
    const totalContractsSigned = await prisma.lead.count({
      where: { status: LeadStatus.signed_contract },
    })
    const totalNotesLeft = await prisma.activity.count({
      where: { type: ActivityType.NOTE_ADDED },
    })

    const lastLead = await prisma.lead.findFirst({
      orderBy: { createdAt: "desc" },
    })

    const lastLeadEntered = lastLead ? formatTimeAgo(lastLead.createdAt) : "N/A"
    
    const topUsersByLeads = await prisma.lead.groupBy({
      by: ["assignedToId"],
      _count: {
        id: true,
      },
      where: {
        assignedToId: {
          not: null,
        },
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 3,
    })

    const userIds = topUsersByLeads.map((u) => u.assignedToId as string)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    })
    
    const topUsers = topUsersByLeads.map((stat) => {
      const user = users.find((u) => u.id === stat.assignedToId)
      return {
        id: user?.id,
        name: user?.name,
        avatar: user?.image,
        leadCount: stat._count.id,
      }
    }).sort((a, b) => b.leadCount - a.leadCount)

    const stats = {
      totalLeads,
      totalJobsCompleted,
      totalContractsSigned,
      totalNotesLeft,
      lastLeadEntered,
      topUsers,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching global stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch global stats" },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 