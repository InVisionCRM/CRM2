import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { 
  approveDeletionRequest,
  canApproveDeletions 
} from "@/lib/services/deletion-approval"
import { deleteLead } from "@/lib/db/leads"
import { sendLeadDeletionNotification } from "@/lib/services/admin-notifications"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const requestId = params.id

    // Approve the deletion request
    const approvalResult = await approveDeletionRequest(requestId, {
      id: session.user.id,
      name: session.user.name || 'Unknown Admin',
      email: session.user.email || ''
    })

    if (!approvalResult.success) {
      return NextResponse.json(
        { error: approvalResult.error || "Failed to approve request" },
        { status: 400 }
      )
    }

    // Get the approved request to get lead details
    const { getPendingDeletionRequests } = await import("@/lib/services/deletion-approval")
    const requests = await getPendingDeletionRequests()
    const approvedRequest = requests.find(r => r.id === requestId)

    if (!approvedRequest) {
      return NextResponse.json(
        { error: "Approved request not found" },
        { status: 404 }
      )
    }

    // Actually delete the lead
    const deletionResult = await deleteLead(approvedRequest.leadId, session.user.id)

    if (!deletionResult.success) {
      return NextResponse.json(
        { error: deletionResult.error || "Failed to delete lead" },
        { status: 500 }
      )
    }

    // Send notification to all admins about the approved deletion
    if (deletionResult.deletedLead && session?.accessToken) {
      try {
        await sendLeadDeletionNotification({
          leadId: approvedRequest.leadId,
          leadName: approvedRequest.leadName,
          leadEmail: approvedRequest.leadEmail,
          leadAddress: approvedRequest.leadAddress,
          deletedBy: {
            id: session.user.id,
            name: session.user.name || 'Unknown Admin',
            email: session.user.email || ''
          },
          deletionReason: approvedRequest.reason, // Include the original deletion reason
          leadStatus: approvedRequest.leadStatus,
          createdAt: approvedRequest.createdAt.toISOString()
        }, session)
      } catch (notificationError) {
        console.error("Failed to send deletion notification:", notificationError)
        // Don't fail the approval if notification fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Deletion request approved and lead deleted successfully"
    })
  } catch (error) {
    console.error("Error approving deletion request:", error)
    return NextResponse.json(
      { error: "Failed to approve deletion request" },
      { status: 500 }
    )
  }
} 