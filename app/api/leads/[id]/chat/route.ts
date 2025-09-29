import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getLeadChatSpace, sendLeadChatMessage } from "@/lib/services/leadChatIntegration"

// GET - Get chat space information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leadId = params.id

    const result = await getLeadChatSpace(leadId, session)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to get chat space" },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      space: result.space 
    })
  } catch (error) {
    console.error("Error getting lead chat space:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Send a message to the lead's chat space
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leadId = params.id
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      )
    }

    const result = await sendLeadChatMessage(leadId, message, session)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send message" },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Message sent successfully" 
    })
  } catch (error) {
    console.error("Error sending lead chat message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 