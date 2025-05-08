import { NextResponse } from "next/server"
import { getLeadById, updateLead, deleteLead } from "@/lib/db/leads"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { LeadStatus } from "@prisma/client"

interface UpdateLeadInput {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  status?: LeadStatus
  assignedToId?: string | null
  notes?: string | null
  userId: string
}

// GET /api/leads/[id]
export async function GET(request: Request, context: any) {
  const { params } = await context
  const id = params.id

  try {
    const lead = await getLeadById(id)

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
  }
}

// PUT /api/leads/[id]
export async function PUT(request: Request, context: any) {
  const { params } = await context
  const id = params.id

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const updateData: UpdateLeadInput = {
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      status: body.status as LeadStatus,
      assignedToId: body.assigned_to,
      notes: body.notes,
      userId: session.user.id
    }

    const { userId, ...rest } = updateData
    const cleanedRest = Object.fromEntries(
      Object.entries(rest).filter(([_, value]) => value !== undefined)
    )
    const cleanedData: UpdateLeadInput = { ...cleanedRest, userId }

    const updatedLead = await updateLead(id, cleanedData)

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error(`Error updating lead:`, error)
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

// DELETE /api/leads/[id]
export async function DELETE(_request: Request, context: any) {
  const { params } = await context
  const id = params.id

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deletedLead = await deleteLead(id)

    if (!deletedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Lead deleted successfully" })
  } catch (error) {
    console.error(`Error deleting lead:`, error)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
