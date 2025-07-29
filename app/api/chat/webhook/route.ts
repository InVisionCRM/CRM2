import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the incoming message for debugging
    console.log('Google Chat webhook received:', body)
    
    // Handle different types of messages
    const { type, message, space } = body
    
    if (type === 'MESSAGE') {
      // Handle incoming message
      const text = message?.text || ''
      
      // You can add logic here to handle specific commands
      if (text.toLowerCase().includes('help')) {
        return NextResponse.json({
          text: "I'm your CRM Chat Bot! I can help with lead management. Try saying 'status' to check lead status."
        })
      }
      
      if (text.toLowerCase().includes('status')) {
        return NextResponse.json({
          text: "Lead status feature coming soon! I'll be able to check and update lead statuses."
        })
      }
      
      // Default response
      return NextResponse.json({
        text: "Hello! I'm your CRM assistant. I can help with lead management tasks."
      })
    }
    
    // Handle other event types
    return NextResponse.json({
      text: "Event received: " + type
    })
    
  } catch (error) {
    console.error('Error handling Google Chat webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Verification endpoint
  return NextResponse.json({ 
    status: 'CRM Chat Bot is running',
    timestamp: new Date().toISOString()
  })
} 