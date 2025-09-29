import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sendLeadDeletionNotification } from "@/lib/services/admin-notifications"
import { prisma } from "@/lib/db/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin (only admins can test notifications)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Only admins can test notifications" }, { status: 403 })
    }

    // Parse test data from request body
    const body = await request.json()
    const {
      leadId = "test-lead-id",
      leadName = "Test Lead",
      leadEmail = "test@example.com",
      leadAddress = "123 Test Street",
      leadStatus = "new_leads",
      deletionReason = "Testing notification system"
    } = body

    // Send test notification
    await sendLeadDeletionNotification({
      leadId,
      leadName,
      leadEmail,
      leadAddress,
      deletedBy: {
        id: session.user.id,
        name: session.user.name || "Test User",
        email: session.user.email || "test@example.com"
      },
      deletionReason,
      leadStatus,
      createdAt: new Date().toISOString()
    }, session)

    return NextResponse.json({ 
      success: true, 
      message: "Test notification sent to all admin users",
      testData: {
        leadId,
        leadName,
        leadEmail,
        leadAddress,
        leadStatus,
        deletionReason
      }
    })

  } catch (error) {
    console.error("Error sending test notification:", error)
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    )
  }
} 