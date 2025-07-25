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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build where clause based on user role
    const whereClause = user.role === 'ADMIN' 
      ? {} 
      : { assignedTo: session.user.id }

    // Get all status counts for the user's leads
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        status: true
      }
    })

    // Convert to the expected format
    const formattedStatusCounts = statusCounts.map(({ status, _count }) => ({
      status,
      count: _count.status,
      label: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))

    // Sort by a predefined order
    const statusOrder: LeadStatus[] = [
      'new_leads',
      'in_progress', 
      'pending',
      'follow_up',
      'estimate_sent',
      'contract_sent',
      'completed_jobs',
      'cancelled'
    ]

    const sortedStatusCounts = statusOrder
      .map(status => formattedStatusCounts.find(item => item.status === status))
      .filter(Boolean)

    return NextResponse.json({
      statusCounts: sortedStatusCounts,
      userRole: user.role
    })

  } catch (error) {
    console.error("Error fetching user lead status counts:", error)
    return NextResponse.json(
      { error: "Failed to fetch user lead status counts" },
      { status: 500 }
    )
  }
} 