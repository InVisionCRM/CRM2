import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { 
  createDeletionRequest, 
  getPendingDeletionRequests,
  canApproveDeletions 
} from "@/lib/services/deletion-approval"
import { getLeadById } from "@/lib/db/leads"
import { sendDeletionRequestNotification } from "@/lib/services/admin-notifications"

// GET - Get all pending deletion requests (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can approve deletions
    const canApprove = await canApproveDeletions(session.user.id)
    if (!canApprove) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const requests = await getPendingDeletionRequests()
    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching deletion requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch deletion requests" },
      { status: 500 }
    )
  }
}

// POST - Create a new deletion request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { leadId, reason } = body

    if (!leadId) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      )
    }

    // Get lead details
    const lead = await getLeadById(leadId)
    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Create deletion request
    const deletionRequest = await createDeletionRequest(leadId, {
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
      request: deletionRequest,
      message: "Deletion request created successfully. Waiting for admin approval."
    })
  } catch (error) {
    console.error("Error creating deletion request:", error)
    return NextResponse.json(
      { error: "Failed to create deletion request" },
      { status: 500 }
    )
  }
} 