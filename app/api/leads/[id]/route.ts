import { NextResponse } from "next/server"
import { getLeadById, updateLead } from "@/lib/db/leads"
import { prisma } from "@/lib/db/prisma"
import type { UpdateLeadInput } from "@/lib/db/leads"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { deleteLead } from "@/lib/db/leads"
import { sendLeadDeletionNotification, sendDeletionRequestNotification } from "@/lib/services/admin-notifications"
import { createDeletionRequest } from "@/lib/services/deletion-approval"

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

    // Get request body for deletion reason
    const body = await request.json().catch(() => ({}))
    const reason = body.reason

    // Get lead details first
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        address: true,
        status: true,
        createdAt: true
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Create deletion request instead of immediately deleting
    const deletionRequest = await createDeletionRequest(id, {
      leadName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead',
      leadEmail: lead.email || '',
      leadAddress: lead.address || '',
      leadStatus: lead.status,
      requestedBy: {
        id: session.user.id,
        name: session.user.name || 'Unknown User',
        email: session.user.email || ''
      },
      reason
    })

    // Send notification to all admins about the deletion request
    if (session?.accessToken) {
      try {
        await sendDeletionRequestNotification({
          requestId: deletionRequest.id,
          leadId: deletionRequest.leadId,
          leadName: deletionRequest.leadName,
          leadEmail: deletionRequest.leadEmail,
          leadAddress: deletionRequest.leadAddress,
          requestedBy: {
            id: session.user.id,
            name: session.user.name || 'Unknown User',
            email: session.user.email || ''
          },
          reason: deletionRequest.reason,
          leadStatus: deletionRequest.leadStatus,
          createdAt: deletionRequest.createdAt.toISOString()
        }, session)
      } catch (notificationError) {
        console.error("Failed to send deletion request notification:", notificationError)
        // Don't fail the request creation if notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Deletion request created successfully. Waiting for admin approval.",
      requestId: deletionRequest.id
    })
  } catch (error) {
    console.error("Error creating deletion request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}