import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, spaceId, userEmail } = body

    console.log('Test chat command received:', { command, spaceId, userEmail })

    // Return a simple test response
    return NextResponse.json({
      text: `✅ Test successful! Command: ${command}, Space: ${spaceId}, User: ${userEmail}`
    })
  } catch (error) {
    console.error('Error in test chat command:', error)
    return NextResponse.json(
      { error: 'Failed to process test command' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Chat commands test endpoint is working",
    timestamp: new Date().toISOString()
  })
} 