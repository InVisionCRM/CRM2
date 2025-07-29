import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { 
  rejectDeletionRequest,
  canApproveDeletions 
} from "@/lib/services/deletion-approval"

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
    const body = await request.json()
    const { rejectionReason } = body

    if (!rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      )
    }

    // Reject the deletion request
    const rejectionResult = await rejectDeletionRequest(requestId, {
      id: session.user.id,
      name: session.user.name || 'Unknown Admin',
      email: session.user.email || ''
    }, rejectionReason)

    if (!rejectionResult.success) {
      return NextResponse.json(
        { error: rejectionResult.error || "Failed to reject request" },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Deletion request rejected successfully"
    })
  } catch (error) {
    console.error("Error rejecting deletion request:", error)
    return NextResponse.json(
      { error: "Failed to reject deletion request" },
      { status: 500 }
    )
  }
} 