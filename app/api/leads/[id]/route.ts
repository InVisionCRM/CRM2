import { NextResponse } from "next/server"
import { getLeadById, updateLead } from "@/lib/db/leads"
import { prisma } from "@/lib/prisma"
import type { UpdateLeadInput } from "@/lib/db/leads"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { deleteLead } from "@/lib/db/leads"
import { sendLeadDeletionNotification } from "@/lib/services/admin-notifications"

export async function GET(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise
    const id = params.id
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            name: true
          }
        }
      }
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error(`Error fetching lead:`, error)
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise
    const id = params.id
    const body = await request.json()

    // TODO: Get userId from session/authentication
    const userId = "placeholder-user-id" // Placeholder - replace with actual user ID from session

    // Transform the incoming data to match our function parameters
    const updateData: Partial<UpdateLeadInput> = {
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      phone: body.phone,
      address: body.address || `${body.street_address || ''} ${body.city || ''} ${body.state || ''} ${body.zipcode || ''}`.trim(),
      status: body.status,
      assignedToId: body.assigned_to,
      notes: body.notes,
      userId: userId,
    }

    // Clean undefined values
    Object.keys(updateData).forEach((keyStr) => {
      const key = keyStr as keyof typeof updateData;
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Ensure all required fields for UpdateLeadInput are present after cleaning, or handle appropriately.
    // For example, if userId was optional in the input but required by updateLead, ensure it's set.
    const finalUpdateData = { ...updateData, userId: userId } // Ensure userId is definitely there

    const updatedLead = await updateLead(id, finalUpdateData as UpdateLeadInput)

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error(`Error updating lead:`, error)
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

// Add PATCH support - same logic as PUT
export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params: paramsPromise })
}

export async function DELETE(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await paramsPromise
    const id = params.id

    const result = await deleteLead(id, session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete lead" },
        { status: result.error === "Lead not found" ? 404 : 
          result.error === "Unauthorized to delete this lead" ? 403 : 500 }
      )
    }

    // Send notification to admins if lead was successfully deleted
    if (result.success && result.deletedLead && session?.accessToken) {
      try {
        const leadName = `${result.deletedLead.firstName || ''} ${result.deletedLead.lastName || ''}`.trim() || 'Unknown Lead'
        
        await sendLeadDeletionNotification({
          leadId: id,
          leadName,
          leadEmail: result.deletedLead.email || '',
          leadAddress: result.deletedLead.address || '',
          deletedBy: result.deletedLead.deletedBy,
          leadStatus: result.deletedLead.status,
          createdAt: result.deletedLead.createdAt.toISOString()
        }, session)
      } catch (notificationError) {
        console.error("Failed to send lead deletion notification:", notificationError)
        // Don't fail the deletion if notification fails
      }
    }

    return NextResponse.json({ success: true, message: "Lead deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}