import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { GoogleChatService } from "@/lib/services/googleChat"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 401 })
    }

    // Initialize Google Chat service
    const googleChat = new GoogleChatService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessToken: session.accessToken as string,
      refreshToken: session.refreshToken as string | undefined,
    })

    // Test creating a simple space
    const result = await googleChat.createSpace({
      displayName: "Test CRM Space",
      members: [session.user.email || '']
    })

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        spaceId: result.spaceId,
        message: "Test space created successfully"
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      })
    }

  } catch (error) {
    console.error("Error testing Google Chat:", error)
    return NextResponse.json(
      { error: "Failed to test Google Chat" },
      { status: 500 }
    )
  }
} 