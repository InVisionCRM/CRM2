import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth-utils"
import { startOfDay, endOfDay, addDays, subDays } from "date-fns"
import { Prisma, KnockStatus } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "upcoming"
    
    const now = new Date()
    const today = startOfDay(now)
    const tomorrow = endOfDay(now)

    // Base query with common includes
    const baseQuery: Prisma.VisitFindManyArgs = {
      include: {
        lead: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      where: {
        userId: session.user.id,
        followUpDate: { not: null },
      },
      orderBy: {
        followUpDate: "asc",
      },
    }

    // Modify where clause based on type
    switch (type) {
      case "upcoming":
        baseQuery.where = {
          userId: session.user.id,
          followUpDate: {
            gte: tomorrow,
          },
          status: {
            not: KnockStatus.APPOINTMENT_SET,
          },
        }
        break

      case "today":
        baseQuery.where = {
          userId: session.user.id,
          followUpDate: {
            gte: today,
            lte: tomorrow,
          },
          status: {
            not: KnockStatus.APPOINTMENT_SET,
          },
        }
        break

      case "past":
        baseQuery.where = {
          userId: session.user.id,
          followUpDate: {
            lt: today,
          },
          status: {
            not: KnockStatus.APPOINTMENT_SET,
          },
        }
        break

      case "completed":
        baseQuery.where = {
          userId: session.user.id,
          followUpDate: { not: null },
          status: KnockStatus.APPOINTMENT_SET,
        }
        break
    }

    const followUps = await prisma.visit.findMany(baseQuery)

    return NextResponse.json(followUps)
  } catch (error) {
    console.error("Error fetching follow-ups:", error)
    return NextResponse.json(
      { error: "Failed to fetch follow-ups" },
      { status: 500 }
    )
  }
} 