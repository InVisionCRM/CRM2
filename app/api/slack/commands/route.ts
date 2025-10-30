import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
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
 * Handle /lead [search query] command
 * Search for leads by name or claim number
 */
async function handleLeadCommand(text: string, userId: string) {
  console.log('🔍 [SLACK CMD] /lead command called with text:', text)

  if (!text || text.trim() === '') {
    return {
      response_type: 'ephemeral',
      text: '❌ Please provide a search term (name or claim number)',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Usage:* `/lead [first name or last name or claim #]`\n\n*Examples:*\n• `/lead John`\n• `/lead Smith`\n• `/lead 12345`'
          }
        }
      ]
    }
  }

  const searchTerm = text.trim()

  try {
    // Search leads by first name, last name, or claim number
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { claimNumber: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        claimNumber: true,
        status: true,
        address: true,
        slackChannelId: true,
        slackChannelName: true,
        assignedTo: {
          select: {
            name: true
          }
        }
      },
      take: 10 // Limit to 10 results
    })

    if (leads.length === 0) {
      return {
        response_type: 'ephemeral',
        text: `❌ No leads found matching "${searchTerm}"`
      }
    }

    // Build results
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Found ${leads.length} lead${leads.length > 1 ? 's' : ''} matching "${searchTerm}":*`
        }
      },
      {
        type: 'divider'
      }
    ]

    leads.forEach(lead => {
      const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'
      const claimInfo = lead.claimNumber ? ` | Claim #${lead.claimNumber}` : ''
      const statusInfo = lead.status ? ` | ${formatStatus(lead.status)}` : ''
      const assignedInfo = lead.assignedTo?.name ? ` | Assigned to: ${lead.assignedTo.name}` : ''

      const slackChannelLink = lead.slackChannelId && lead.slackChannelName
        ? `<slack://channel?team=T09PUHBE61J&id=${lead.slackChannelId}|#${lead.slackChannelName}>`
        : '_(No Slack channel)_'

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${leadName}*${claimInfo}${statusInfo}${assignedInfo}\n📍 ${lead.address || 'No address'}\n💬 ${slackChannelLink} | <${appUrl}/leads/${lead.id}|View in CRM>`
        }
      })
    })

    if (leads.length === 10) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '_Showing first 10 results. Refine your search for more specific results._'
          }
        ]
      })
    }

    return {
      response_type: 'ephemeral',
      blocks
    }
  } catch (error) {
    console.error('❌ [SLACK CMD] Error in /lead command:', error)
    return {
      response_type: 'ephemeral',
      text: '❌ Error searching for leads. Please try again.'
    }
  }
}

/**
 * Handle /newlead command
 * Opens a modal for creating a new lead
 */
async function handleNewLeadCommand(triggerId: string) {
  console.log('🔍 [SLACK CMD] /newlead command called with trigger_id:', triggerId)

  if (!triggerId) {
    return {
      response_type: 'ephemeral',
      text: '❌ Missing trigger_id. Please try again.'
    }
  }

  const slackToken = process.env.SLACK_BOT_TOKEN
  if (!slackToken) {
    return {
      response_type: 'ephemeral',
      text: '❌ Slack integration not configured. Please contact an admin.'
    }
  }

  try {
    // Open modal using Slack's views.open API
    const modalResponse = await fetch('https://slack.com/api/views.open', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: 'create_lead_modal',
          title: {
            type: 'plain_text',
            text: 'Create New Lead'
          },
          submit: {
            type: 'plain_text',
            text: 'Create Lead'
          },
          close: {
            type: 'plain_text',
            text: 'Cancel'
          },
          blocks: [
            {
              type: 'input',
              block_id: 'first_name_block',
              label: {
                type: 'plain_text',
                text: 'First Name'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'first_name',
                placeholder: {
                  type: 'plain_text',
                  text: 'Enter first name'
                }
              }
            },
            {
              type: 'input',
              block_id: 'last_name_block',
              label: {
                type: 'plain_text',
                text: 'Last Name'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'last_name',
                placeholder: {
                  type: 'plain_text',
                  text: 'Enter last name'
                }
              }
            },
            {
              type: 'input',
              block_id: 'address_block',
              label: {
                type: 'plain_text',
                text: 'Address'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'address',
                placeholder: {
                  type: 'plain_text',
                  text: 'Enter street address'
                }
              }
            },
            {
              type: 'input',
              block_id: 'phone_block',
              optional: true,
              label: {
                type: 'plain_text',
                text: 'Phone Number'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'phone',
                placeholder: {
                  type: 'plain_text',
                  text: '555-123-4567'
                }
              }
            },
            {
              type: 'input',
              block_id: 'email_block',
              optional: true,
              label: {
                type: 'plain_text',
                text: 'Email'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'email',
                placeholder: {
                  type: 'plain_text',
                  text: 'email@example.com'
                }
              }
            },
            {
              type: 'input',
              block_id: 'insurance_block',
              optional: true,
              label: {
                type: 'plain_text',
                text: 'Insurance Company'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'insurance',
                placeholder: {
                  type: 'plain_text',
                  text: 'Enter insurance company name'
                }
              }
            },
            {
              type: 'input',
              block_id: 'claim_number_block',
              optional: true,
              label: {
                type: 'plain_text',
                text: 'Claim Number'
              },
              element: {
                type: 'plain_text_input',
                action_id: 'claim_number',
                placeholder: {
                  type: 'plain_text',
                  text: 'Enter claim number'
                }
              }
            }
          ]
        }
      })
    })

    const modalData = await modalResponse.json()

    if (!modalData.ok) {
      console.error('❌ [SLACK CMD] Failed to open modal:', modalData)
      return {
        response_type: 'ephemeral',
        text: `❌ Failed to open modal: ${modalData.error || 'Unknown error'}`
      }
    }

    console.log('✅ [SLACK CMD] Modal opened successfully')

    // Return empty response since modal was opened
    return {
      response_type: 'ephemeral',
      text: ''
    }
  } catch (error) {
    console.error('❌ [SLACK CMD] Error opening modal:', error)
    return {
      response_type: 'ephemeral',
      text: '❌ Error opening lead creation form. Please try again.'
    }
  }
}

/**
 * Handle /cs command (change status)
 * Search for a lead and allow changing its status
 */
async function handleStatusCommand(text: string, triggerId: string, userId: string) {
  console.log('🔍 [SLACK CMD] /cs command called with text:', text)

  if (!text || text.trim() === '') {
    return {
      response_type: 'ephemeral',
      text: '❌ Please provide a search term (name or claim number)',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Usage:* `/cs [first name or last name or claim #]`\n\n*Examples:*\n• `/cs John`\n• `/cs Smith`\n• `/cs 12345`'
          }
        }
      ]
    }
  }

  const searchTerm = text.trim()

  try {
    // Search leads by first name, last name, or claim number
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { claimNumber: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        claimNumber: true,
        status: true,
        address: true
      },
      take: 10
    })

    if (leads.length === 0) {
      return {
        response_type: 'ephemeral',
        text: `❌ No leads found matching "${searchTerm}"`
      }
    }

    // If only one lead found, open modal immediately
    if (leads.length === 1) {
      const lead = leads[0]
      return await openStatusChangeModal(triggerId, lead)
    }

    // If multiple leads found, show selection
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Found ${leads.length} leads matching "${searchTerm}". Click a button to change status:*`
        }
      },
      {
        type: 'divider'
      }
    ]

    leads.forEach(lead => {
      const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'
      const claimInfo = lead.claimNumber ? ` | Claim #${lead.claimNumber}` : ''
      const statusInfo = lead.status ? ` | ${formatStatus(lead.status)}` : ''

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${leadName}*${claimInfo}${statusInfo}\n📍 ${lead.address || 'No address'}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Change Status'
          },
          value: lead.id,
          action_id: `change_status_${lead.id}`
        }
      })
    })

    return {
      response_type: 'ephemeral',
      blocks
    }
  } catch (error) {
    console.error('❌ [SLACK CMD] Error in /status command:', error)
    return {
      response_type: 'ephemeral',
      text: '❌ Error searching for leads. Please try again.'
    }
  }
}

/**
 * Open modal to change lead status
 */
async function openStatusChangeModal(triggerId: string, lead: any) {
  const slackToken = process.env.SLACK_BOT_TOKEN
  if (!slackToken) {
    return {
      response_type: 'ephemeral',
      text: '❌ Slack integration not configured.'
    }
  }

  const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'

  try {
    const modalResponse = await fetch('https://slack.com/api/views.open', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${slackToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trigger_id: triggerId,
        view: {
          type: 'modal',
          callback_id: `change_status_modal_${lead.id}`,
          title: {
            type: 'plain_text',
            text: 'Change Lead Status'
          },
          submit: {
            type: 'plain_text',
            text: 'Update Status'
          },
          close: {
            type: 'plain_text',
            text: 'Cancel'
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Lead:* ${leadName}\n*Current Status:* ${formatStatus(lead.status)}`
              }
            },
            {
              type: 'divider'
            },
            {
              type: 'input',
              block_id: 'status_block',
              label: {
                type: 'plain_text',
                text: 'New Status'
              },
              element: {
                type: 'static_select',
                action_id: 'status_select',
                placeholder: {
                  type: 'plain_text',
                  text: 'Select new status'
                },
                options: [
                  {
                    text: { type: 'plain_text', text: '👀 Follow Ups' },
                    value: 'follow_ups'
                  },
                  {
                    text: { type: 'plain_text', text: '✍️ Signed Contract' },
                    value: 'signed_contract'
                  },
                  {
                    text: { type: 'plain_text', text: '📆 Scheduled' },
                    value: 'scheduled'
                  },
                  {
                    text: { type: 'plain_text', text: '🎨 Colors' },
                    value: 'colors'
                  },
                  {
                    text: { type: 'plain_text', text: '💰 ACV' },
                    value: 'acv'
                  },
                  {
                    text: { type: 'plain_text', text: '🚧 Job' },
                    value: 'job'
                  },
                  {
                    text: { type: 'plain_text', text: '✅ Completed Jobs' },
                    value: 'completed_jobs'
                  },
                  {
                    text: { type: 'plain_text', text: '📄💯 Zero Balance' },
                    value: 'zero_balance'
                  },
                  {
                    text: { type: 'plain_text', text: '💀 Denied' },
                    value: 'denied'
                  }
                ]
              }
            }
          ]
        }
      })
    })

    const modalData = await modalResponse.json()

    if (!modalData.ok) {
      console.error('❌ [SLACK CMD] Failed to open modal:', modalData)
      return {
        response_type: 'ephemeral',
        text: `❌ Failed to open modal: ${modalData.error || 'Unknown error'}`
      }
    }

    return {
      response_type: 'ephemeral',
      text: ''
    }
  } catch (error) {
    console.error('❌ [SLACK CMD] Error opening modal:', error)
    return {
      response_type: 'ephemeral',
      text: '❌ Error opening status change form. Please try again.'
    }
  }
}

/**
 * Handle /myleads command
 * Show all leads assigned to the user
 */
async function handleMyLeadsCommand(userId: string, userEmail: string) {
  console.log('🔍 [SLACK CMD] /myleads command called for:', userEmail)

  try {
    // Find the user in our database by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true }
    })

    if (!user) {
      return {
        response_type: 'ephemeral',
        text: '❌ Your Slack email is not associated with any CRM user. Please contact an admin.'
      }
    }

    // Get all leads assigned to this user
    const leads = await prisma.lead.findMany({
      where: {
        assignedToId: user.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        claimNumber: true,
        status: true,
        address: true,
        slackChannelId: true,
        slackChannelName: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20 // Show up to 20 leads
    })

    if (leads.length === 0) {
      return {
        response_type: 'ephemeral',
        text: '📋 You have no leads assigned to you at the moment.'
      }
    }

    // Group leads by status
    const leadsByStatus: Record<string, typeof leads> = {}
    leads.forEach(lead => {
      const status = lead.status || 'UNKNOWN'
      if (!leadsByStatus[status]) {
        leadsByStatus[status] = []
      }
      leadsByStatus[status].push(lead)
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Your Leads (${leads.length} total)*`
        }
      },
      {
        type: 'divider'
      }
    ]

    // Add leads grouped by status
    Object.entries(leadsByStatus).forEach(([status, statusLeads]) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${formatStatus(status)}* (${statusLeads.length})`
        }
      })

      statusLeads.forEach(lead => {
        const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'
        const claimInfo = lead.claimNumber ? ` | Claim #${lead.claimNumber}` : ''

        const slackChannelLink = lead.slackChannelId && lead.slackChannelName
          ? `<slack://channel?team=T09PUHBE61J&id=${lead.slackChannelId}|#${lead.slackChannelName}>`
          : '_(No Slack channel)_'

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• ${leadName}${claimInfo}\n  💬 ${slackChannelLink} | <${appUrl}/leads/${lead.id}|View in CRM>`
          }
        })
      })

      blocks.push({
        type: 'divider'
      })
    })

    if (leads.length === 20) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '_Showing first 20 leads. View all in the CRM._'
          }
        ]
      })
    }

    return {
      response_type: 'ephemeral',
      blocks
    }
  } catch (error) {
    console.error('❌ [SLACK CMD] Error in /myleads command:', error)
    return {
      response_type: 'ephemeral',
      text: '❌ Error fetching your leads. Please try again.'
    }
  }
}

/**
 * Format lead status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'follow_ups': '📞 Follow Ups',
    'SIGNED_CONTRACT': '✍️ Signed Contract',
    'SCHEDULED': '📅 Scheduled',
    'COLORS': '🎨 Colors',
    'ACV': '💰 ACV',
    'JOB': '🔨 Job',
    'COMPLETED_JOBS': '✅ Completed',
    'DENIED': '❌ Denied',
    'ZERO_BALANCE': '💵 Zero Balance'
  }

  return statusMap[status] || status.replace(/_/g, ' ')
}

/**
 * Main POST handler for Slack slash commands
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [SLACK CMD] Received Slack command request')
    console.log('🔍 [SLACK CMD] Headers:', Object.fromEntries(request.headers))

    // Get raw body for signature verification
    const rawBody = await request.text()
    console.log('🔍 [SLACK CMD] Raw body received:', rawBody.substring(0, 100) + '...')

    // TEMPORARILY SKIP signature verification for testing
    // TODO: Re-enable this after testing!
    const skipVerification = process.env.SLACK_SKIP_VERIFICATION === 'true'

    if (!skipVerification) {
      // Verify the request came from Slack
      if (!verifySlackRequest(request, rawBody)) {
        console.error('❌ [SLACK CMD] Invalid Slack signature')
        return NextResponse.json({
          response_type: 'ephemeral',
          text: '❌ Invalid request signature'
        })
      }
    } else {
      console.log('⚠️ [SLACK CMD] Signature verification SKIPPED (testing mode)')
    }

    // Parse the form data
    const params = new URLSearchParams(rawBody)
    const command = params.get('command')
    const text = params.get('text') || ''
    const userId = params.get('user_id') || ''
    const userName = params.get('user_name') || ''
    const channelId = params.get('channel_id') || ''
    const responseUrl = params.get('response_url') || ''

    // Get user email from Slack API if needed
    // For /myleads, we need the email to look up the user
    const userEmail = params.get('user_email') || '' // This might not be available in all cases

    console.log('🔍 [SLACK CMD] Command:', command, '| Text:', text, '| User:', userName)

    let response

    switch (command) {
      case '/lead':
        response = await handleLeadCommand(text, userId)
        break

      case '/newlead':
        response = await handleNewLeadCommand(params.get('trigger_id') || '')
        break

      case '/cs':
        response = await handleStatusCommand(text, params.get('trigger_id') || '', userId)
        break

      case '/myleads':
        // For /myleads, we need to get the user's email
        // Slack doesn't always provide user_email in slash command payload
        // We need to look it up via Slack API
        try {
          const slackToken = process.env.SLACK_BOT_TOKEN
          if (!slackToken) {
            throw new Error('SLACK_BOT_TOKEN not configured')
          }

          // Get user info from Slack
          const userInfoResponse = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
            headers: {
              'Authorization': `Bearer ${slackToken}`
            }
          })
          const userInfo = await userInfoResponse.json()

          if (userInfo.ok && userInfo.user?.profile?.email) {
            response = await handleMyLeadsCommand(userId, userInfo.user.profile.email)
          } else {
            response = {
              response_type: 'ephemeral',
              text: '❌ Could not retrieve your email from Slack. Please contact an admin.'
            }
          }
        } catch (error) {
          console.error('❌ [SLACK CMD] Error fetching user info:', error)
          response = {
            response_type: 'ephemeral',
            text: '❌ Error fetching your user information. Please try again.'
          }
        }
        break

      default:
        response = {
          response_type: 'ephemeral',
          text: `❌ Unknown command: ${command}`
        }
    }

    console.log('✅ [SLACK CMD] Sending response')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [SLACK CMD] Error handling Slack command:', error)
    console.error('❌ [SLACK CMD] Error stack:', error instanceof Error ? error.stack : 'No stack')

    // Always return a valid Slack response, even on error
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `❌ An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}

// Add GET handler for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Slack commands endpoint is working',
    availableCommands: ['/lead', '/myleads', '/newlead', '/cs'],
    timestamp: new Date().toISOString()
  })
}
