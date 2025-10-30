import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple test endpoint to verify Slack can reach the server
 * This endpoint has no authentication - just for testing connectivity
 */
export async function POST(request: NextRequest) {
  console.log('✅ [SLACK TEST] Test endpoint hit!')
  console.log('Headers:', Object.fromEntries(request.headers))

  try {
    const body = await request.text()
    console.log('Body:', body)

    return NextResponse.json({
      response_type: 'ephemeral',
      text: '✅ Connection successful! Your Slack app can reach the server.'
    })
  } catch (error) {
    console.error('❌ [SLACK TEST] Error:', error)
    return NextResponse.json({
      response_type: 'ephemeral',
      text: '❌ Error in test endpoint'
    })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Slack test endpoint is working',
    timestamp: new Date().toISOString()
  })
}
