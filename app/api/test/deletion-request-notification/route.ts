import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { sendDeletionRequestNotification } from "@/lib/services/admin-notifications"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    const body = await request.json()
    const { leadName = "Test Lead", leadEmail = "test@example.com", leadAddress = "123 Test St" } = body

    // Send test notification
    await sendDeletionRequestNotification({
      requestId: "test-request-id",
      leadId: "test-lead-id",
      leadName,
      leadEmail,
      leadAddress,
      requestedBy: {
        id: session.user.id,
        name: session.user.name || 'Test User',
        email: session.user.email || 'test@example.com'
      },
      reason: "Test notification",
      leadStatus: "follow_ups",
      createdAt: new Date().toISOString()
    }, session)

    return NextResponse.json({ 
      success: true, 
      message: "Test deletion request notification sent successfully"
    })
  } catch (error) {
    console.error("Error sending test notification:", error)
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    )
  }
} 