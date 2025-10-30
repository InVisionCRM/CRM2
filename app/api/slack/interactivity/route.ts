import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createLeadSlackChannel } from '@/lib/services/leadSlackIntegration'
import crypto from 'crypto'

/**
 * Verify that the request came from Slack
 */
function verifySlackRequest(request: NextRequest, body: string): boolean {
  const slackSigningSecret = process.env.SLACK_SIGNING_SECRET
  if (!slackSigningSecret) {
    console.error('SLACK_SIGNING_SECRET not configured')
    return false
  }

  const timestamp = request.headers.get('x-slack-request-timestamp')
  const slackSignature = request.headers.get('x-slack-signature')

  if (!timestamp || !slackSignature) {
    return false
  }

  // Prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - parseInt(timestamp)) > 60 * 5) {
    console.error('Slack request timestamp too old')
    return false
  }

  // Create signature
  const sigBasestring = `v0:${timestamp}:${body}`
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', slackSigningSecret)
    .update(sigBasestring)
    .digest('hex')

  // Compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(slackSignature)
  )
}

/**
 * Handle modal submission for creating a new lead
 */
async function handleCreateLeadModal(payload: any) {
  console.log('🔍 [SLACK MODAL] Handling create_lead_modal submission')

  try {
    // Extract values from modal submission
    const values = payload.view.state.values

    const firstName = values.first_name_block?.first_name?.value
    const lastName = values.last_name_block?.last_name?.value
    const address = values.address_block?.address?.value
    const phone = values.phone_block?.phone?.value || null
    const email = values.email_block?.email?.value || null
    const insurance = values.insurance_block?.insurance?.value || null
    const claimNumber = values.claim_number_block?.claim_number?.value || null

    // Get the user who submitted the form
    const slackUserId = payload.user.id

    console.log('🔍 [SLACK MODAL] Form data:', {
      firstName,
      lastName,
      address,
      phone,
      email,
      insurance,
      claimNumber,
      slackUserId
    })

    // Validate required fields
    if (!firstName || !lastName || !address) {
      return {
        response_action: 'errors',
        errors: {
          first_name_block: !firstName ? 'First name is required' : undefined,
          last_name_block: !lastName ? 'Last name is required' : undefined,
          address_block: !address ? 'Address is required' : undefined
        }
      }
    }

    // Get Slack user's email to find CRM user
    const slackToken = process.env.SLACK_BOT_TOKEN
    if (!slackToken) {
      throw new Error('SLACK_BOT_TOKEN not configured')
    }

    const userInfoResponse = await fetch(`https://slack.com/api/users.info?user=${slackUserId}`, {
      headers: {
        'Authorization': `Bearer ${slackToken}`
      }
    })
    const userInfo = await userInfoResponse.json()

    if (!userInfo.ok || !userInfo.user?.profile?.email) {
      throw new Error('Could not retrieve user email from Slack')
    }

    const userEmail = userInfo.user.profile.email

    // Find the CRM user by email
    const crmUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true }
    })

    if (!crmUser) {
      throw new Error(`No CRM user found with email: ${userEmail}`)
    }

    // Create the lead with auto-assignment
    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        address,
        phone,
        email,
        insuranceCompany: insurance,
        claimNumber,
        assignedToId: crmUser.id, // Auto-assign to the user who created it
        status: 'follow_ups' // Default status
      }
    })

    console.log('✅ [SLACK MODAL] Lead created:', lead.id)

    // Create an activity for lead creation
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        userId: crmUser.id,
        type: 'NOTE',
        description: `Lead created via Slack by ${crmUser.name}`
      }
    })

    // Auto-create Slack channel for the new lead
    console.log('🔍 [SLACK MODAL] Auto-creating Slack channel for lead:', lead.id)
    const leadName = `${firstName} ${lastName}`
    const channelResult = await createLeadSlackChannel({
      leadId: lead.id,
      leadName: leadName,
      leadEmail: email || undefined,
      leadPhone: phone || undefined,
      leadAddress: address,
      leadStatus: 'follow_ups',
      leadClaimNumber: claimNumber || undefined,
      leadInsuranceCompany: insurance || undefined,
      leadDateOfLoss: undefined, // Not collected in modal
      leadDamageType: undefined, // Not collected in modal
      googleDriveFolderId: undefined, // Drive folder created later
      googleDriveUrl: undefined, // Drive folder created later
      createdBy: {
        id: crmUser.id,
        name: crmUser.name || 'Unknown',
        email: userEmail
      },
      assignedTo: {
        id: crmUser.id,
        name: crmUser.name || 'Unknown',
        email: userEmail
      }
    })

    if (channelResult.success) {
      console.log('✅ [SLACK MODAL] Slack channel created:', channelResult.channelName)
    } else {
      console.error('❌ [SLACK MODAL] Failed to create Slack channel:', channelResult.error)
    }

    // Build success message
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const leadUrl = `${appUrl}/leads/${lead.id}`

    // Send success message to the user
    const responseUrl = payload.response_urls?.[0]?.response_url
    if (responseUrl) {
      const slackChannelInfo = channelResult.success && channelResult.channelId && channelResult.channelName
        ? `\n💬 *Slack Channel:* <slack://channel?team=T09PUHBE61J&id=${channelResult.channelId}|#${channelResult.channelName}>`
        : ''

      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: 'ephemeral',
          text: `✅ Lead created successfully!`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*✅ Lead Created Successfully!*\n\n*Name:* ${firstName} ${lastName}\n*Address:* ${address}${phone ? `\n*Phone:* ${phone}` : ''}${email ? `\n*Email:* ${email}` : ''}${insurance ? `\n*Insurance:* ${insurance}` : ''}${claimNumber ? `\n*Claim #:* ${claimNumber}` : ''}\n*Assigned To:* ${crmUser.name}\n*Status:* Follow Ups${slackChannelInfo}`
              }
            },
            {
              type: 'actions',
              elements: channelResult.success && channelResult.channelId
                ? [
                    {
                      type: 'button',
                      text: {
                        type: 'plain_text',
                        text: 'Open Slack Channel'
                      },
                      url: `slack://channel?team=T09PUHBE61J&id=${channelResult.channelId}`,
                      style: 'primary'
                    },
                    {
                      type: 'button',
                      text: {
                        type: 'plain_text',
                        text: 'View in CRM'
                      },
                      url: leadUrl
                    }
                  ]
                : [
                    {
                      type: 'button',
                      text: {
                        type: 'plain_text',
                        text: 'View in CRM'
                      },
                      url: leadUrl,
                      style: 'primary'
                    }
                  ]
            }
          ]
        })
      })
    }

    // Return success response
    return {
      response_action: 'clear'
    }
  } catch (error) {
    console.error('❌ [SLACK MODAL] Error creating lead:', error)

    // Return error response
    return {
      response_action: 'errors',
      errors: {
        first_name_block: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

/**
 * Main POST handler for Slack interactivity (modals, buttons, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [SLACK INTERACT] Received interactivity request')

    // Get raw body for signature verification
    const rawBody = await request.text()
    console.log('🔍 [SLACK INTERACT] Raw body length:', rawBody.length)

    // TEMPORARILY SKIP signature verification for testing
    const skipVerification = process.env.SLACK_SKIP_VERIFICATION === 'true'

    if (!skipVerification) {
      // Verify the request came from Slack
      if (!verifySlackRequest(request, rawBody)) {
        console.error('❌ [SLACK INTERACT] Invalid Slack signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.log('⚠️ [SLACK INTERACT] Signature verification SKIPPED (testing mode)')
    }

    // Parse the payload (Slack sends it as form-encoded with a 'payload' field)
    const params = new URLSearchParams(rawBody)
    const payloadStr = params.get('payload')

    if (!payloadStr) {
      console.error('❌ [SLACK INTERACT] No payload found')
      return NextResponse.json({ error: 'No payload' }, { status: 400 })
    }

    const payload = JSON.parse(payloadStr)
    console.log('🔍 [SLACK INTERACT] Payload type:', payload.type)
    console.log('🔍 [SLACK INTERACT] Callback ID:', payload.view?.callback_id || payload.callback_id)

    // Handle different interaction types
    let response

    switch (payload.type) {
      case 'view_submission':
        // Handle modal submissions
        const callbackId = payload.view.callback_id

        switch (callbackId) {
          case 'create_lead_modal':
            response = await handleCreateLeadModal(payload)
            break

          default:
            console.error('❌ [SLACK INTERACT] Unknown callback_id:', callbackId)
            response = {
              response_action: 'errors',
              errors: {
                base: 'Unknown form submission'
              }
            }
        }
        break

      default:
        console.error('❌ [SLACK INTERACT] Unknown interaction type:', payload.type)
        return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 })
    }

    console.log('✅ [SLACK INTERACT] Sending response')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [SLACK INTERACT] Error handling interaction:', error)
    console.error('❌ [SLACK INTERACT] Error stack:', error instanceof Error ? error.stack : 'No stack')

    // Return error response
    return NextResponse.json({
      response_action: 'errors',
      errors: {
        base: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    })
  }
}

// Add GET handler for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Slack interactivity endpoint is working',
    timestamp: new Date().toISOString()
  })
}
