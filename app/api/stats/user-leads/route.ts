import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("User leads API called")
    const session = await getServerSession(authOptions)
    
    console.log("Session:", session ? "Found" : "Not found")
    console.log("User ID:", session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's role to determine which leads they can see
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    console.log("User found:", user ? "Yes" : "No")
    console.log("User role:", user?.role)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build where clause based on user role
    const whereClause = user.role === 'ADMIN' 
      ? {} 
      : { assignedTo: userId }
    
    console.log("Where clause:", whereClause)

    // Get inactive leads (not updated in over 1 week)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const inactiveLeads = await prisma.lead.findMany({
      where: {
        ...whereClause,
        updatedAt: {
          lt: oneWeekAgo
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'asc' }
    })

    // Get leads with no documents
    const noDocumentLeads = await prisma.lead.findMany({
      where: {
        ...whereClause,
        files: {
          none: {}
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get leads without insurance info
    const noInsuranceLeads = await prisma.lead.findMany({
      where: {
        ...whereClause,
        OR: [
          { insuranceCompany: null },
          { insuranceCompany: "" },
          { insuranceAdjusterName: null },
          { insuranceAdjusterName: "" }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        insuranceCompany: true,
        insuranceAdjusterName: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const response = {
      inactiveLeads: inactiveLeads.length,
      inactiveLeadsList: inactiveLeads,
      noDocumentLeads: noDocumentLeads.length,
      noDocumentLeadsList: noDocumentLeads,
      noInsuranceLeads: noInsuranceLeads.length,
      noInsuranceLeadsList: noInsuranceLeads
    }
    
    console.log("Response data:", response)
    return NextResponse.json(response)

  } catch (error) {
    console.error("Error fetching user lead stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch user lead statistics" },
      { status: 500 }
    )
  }
} 