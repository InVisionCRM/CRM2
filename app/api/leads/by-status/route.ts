import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { LeadStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as LeadStatus
    const userSpecific = searchParams.get('userSpecific') === 'true'

    if (!status) {
      return NextResponse.json({ error: "Status parameter is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

        // Build where clause based on user role and userSpecific parameter
    const whereClause = user.role === 'ADMIN' && !userSpecific
      ? { status }
      : { status, assignedToId: session.user.id }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      status,
      leads,
      count: leads.length
    })

  } catch (error) {
    console.error("Error fetching leads by status:", error)
    return NextResponse.json(
      { error: "Failed to fetch leads by status" },
      { status: 500 }
    )
  }
}
