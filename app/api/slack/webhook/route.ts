import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * Verify Slack request signature
 * This ensures requests are actually coming from Slack
 */
function verifySlackRequest(
  body: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  // Prevent replay attacks (reject requests older than 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - parseInt(timestamp)) > 60 * 5) {
    return false
  }

  // Create signature basestring
  const sigBasestring = `v0:${timestamp}:${body}`

  // Generate HMAC signature
  const hmac = crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex')

  const computedSignature = `v0=${hmac}`

  // Compare signatures (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(signature)
  )
}

/**
 * Slack Events API endpoint
 * Handles incoming events from Slack (messages, mentions, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const bodyJson = JSON.parse(body)

    // Handle URL verification challenge FIRST (before signature verification)
    // This is required for initial Slack Events API setup
    if (bodyJson.type === 'url_verification') {
      console.log('✅ Slack URL verification challenge received')
      return NextResponse.json({ challenge: bodyJson.challenge })
    }

    // Get Slack signature headers
    const slackSignature = request.headers.get('x-slack-signature')
    const slackTimestamp = request.headers.get('x-slack-request-timestamp')

    // Verify request is from Slack (for all non-verification requests)
    const signingSecret = process.env.SLACK_SIGNING_SECRET
    if (!signingSecret) {
      console.error('SLACK_SIGNING_SECRET not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (slackSignature && slackTimestamp) {
      const isValid = verifySlackRequest(
        body,
        slackTimestamp,
        slackSignature,
        signingSecret
      )

      if (!isValid) {
        console.error('Invalid Slack signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Handle events
    if (bodyJson.type === 'event_callback') {
      const event = bodyJson.event

      console.log('📥 Slack event received:', event.type)

      // Handle different event types
      switch (event.type) {
        case 'app_mention':
          console.log('🔔 Bot mentioned:', event.text)
          // You can add custom logic here to respond to mentions
          break

        case 'message':
          // Only process messages that are not from bots
          if (!event.bot_id && event.text) {
            console.log('💬 Message received:', event.text)
            // You can add custom logic here to respond to messages
          }
          break

        default:
          console.log('📭 Unhandled event type:', event.type)
      }

      return NextResponse.json({ ok: true })
    }

    // Handle slash commands (if coming through webhook instead of separate endpoint)
    if (bodyJson.command) {
      console.log('🔧 Slash command received:', bodyJson.command)
      // Redirect to commands handler or process here
      return NextResponse.json({
        text: `Command ${bodyJson.command} received. Processing...`
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error handling Slack webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle GET requests (for testing)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Slack webhook endpoint is active'
  })
}
