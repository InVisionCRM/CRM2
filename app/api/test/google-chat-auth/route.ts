import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleChatService } from "@/lib/services/googleChat"

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

    // Check environment variables
    if (!process.env.GOOGLE_SA_EMAIL || !process.env.GOOGLE_SA_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: "Service account credentials not configured",
        missing: {
          email: !process.env.GOOGLE_SA_EMAIL,
          privateKey: !process.env.GOOGLE_SA_PRIVATE_KEY
        }
      }, { status: 500 })
    }

    // Test Google Chat service authentication
    const googleChat = new GoogleChatService({
      serviceAccountEmail: process.env.GOOGLE_SA_EMAIL,
      serviceAccountPrivateKey: process.env.GOOGLE_SA_PRIVATE_KEY,
    })

    try {
      // Test authentication
      const credentials = await googleChat['auth'].getAccessToken()
      
      return NextResponse.json({ 
        success: true, 
        message: "Google Chat service account authentication successful",
        hasAccessToken: !!credentials.token,
        scopes: googleChat['auth'].scopes
      })
    } catch (authError: any) {
      console.error("Google Chat authentication error:", authError)
      return NextResponse.json({ 
        success: false,
        error: "Google Chat authentication failed",
        details: authError.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error testing Google Chat auth:", error)
    return NextResponse.json(
      { error: "Failed to test Google Chat authentication" },
      { status: 500 }
    )
  }
} 