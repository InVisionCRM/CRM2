import { prisma } from "@/lib/db/prisma"
import { SlackService } from "./slack"
import { UserRole } from "@prisma/client"

/**
 * Map lead status to numbered abbreviation prefix for channel naming
 * This ensures channels auto-sort by status in the correct order
 */
export function getStatusPrefix(status: string): string {
  const statusMap: Record<string, string> = {
    'follow_ups': '1-fup',
    'signed_contract': '2-sign',
    'scheduled': '3-sched',
    'colors': '4-color',
    'acv': '5-acv',
    'job': '6-job',
    'completed_jobs': '7-comp',
    'zero_balance': '8-zero',
    'denied': '9-deny'
  }
  return statusMap[status.toLowerCase()] || '0-unk'
}

/**
 * Generate channel name with numbered status abbreviation prefix
 * Format: {number}-{abbrev}-lead-firstname-lastname
 * Example: 1-fup-lead-john-doe
 */
export function generateChannelName(firstName: string, lastName: string, status: string): string {
  const prefix = getStatusPrefix(status)
  const sanitizedFirstName = firstName.toLowerCase().trim()
  const sanitizedLastName = lastName.toLowerCase().trim()

  return lastName
    ? `${prefix}-lead-${sanitizedFirstName}-${sanitizedLastName}`
    : `${prefix}-lead-${sanitizedFirstName}`
}

export interface LeadSlackData {
  leadId: string
  leadName: string
  leadEmail?: string
  leadPhone?: string
  leadAddress?: string
  leadStatus: string
  leadClaimNumber?: string
  leadInsuranceCompany?: string
  leadDateOfLoss?: Date
  leadDamageType?: string
  googleDriveFolderId?: string
  googleDriveUrl?: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
}

/**
 * Get all admin users from the database
 */
async function getAdminUsers() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return adminUsers
  } catch (error) {
    console.error("Error fetching admin users:", error)
    throw new Error("Failed to fetch admin users")
  }
}

/**
 * Create a Slack channel for a lead
 */
export async function createLeadSlackChannel(
  leadData: LeadSlackData
): Promise<{ success: boolean; channelId?: string; channelName?: string; error?: string }> {
  console.log('🔍 [SLACK SERVICE] createLeadSlackChannel called with:', leadData)

  try {
    // Initialize Slack service
    console.log('🔍 [SLACK SERVICE] Initializing SlackService...')
    const slack = new SlackService()
    console.log('🔍 [SLACK SERVICE] SlackService initialized successfully')

    // Get all admin users
    console.log('🔍 [SLACK SERVICE] Fetching admin users...')
    const adminUsers = await getAdminUsers()
    console.log('🔍 [SLACK SERVICE] Admin users found:', adminUsers.length)

    // Prepare member email list
    const memberEmails: string[] = []

    // Add all admins
    adminUsers.forEach(admin => {
      if (admin.email) {
        memberEmails.push(admin.email)
      }
    })

    // Add the lead creator
    if (leadData.createdBy.email) {
      memberEmails.push(leadData.createdBy.email)
    }

    // Add the assigned user if different from creator
    if (leadData.assignedTo && leadData.assignedTo.email &&
        leadData.assignedTo.email !== leadData.createdBy.email) {
      memberEmails.push(leadData.assignedTo.email)
    }

    console.log('🔍 [SLACK SERVICE] Member emails to add:', memberEmails)

    // Find Slack user IDs from emails
    const memberIds: string[] = []
    for (const email of memberEmails) {
      console.log('🔍 [SLACK SERVICE] Looking up Slack user for:', email)
      const userResult = await slack.findUserByEmail(email)
      if (userResult.success && userResult.userId) {
        console.log('🔍 [SLACK SERVICE] Found Slack user ID:', userResult.userId)
        memberIds.push(userResult.userId)
      } else {
        console.warn(`⚠️ [SLACK SERVICE] Could not find Slack user for email: ${email}`, userResult.error)
      }
    }

    console.log('🔍 [SLACK SERVICE] Total Slack user IDs found:', memberIds.length)

    // Create channel name with status prefix: {status}-lead-firstname-lastname
    // Extract first and last name from leadName
    const nameParts = leadData.leadName.split(' ')
    const firstName = nameParts[0] || 'unknown'
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''

    // Build channel name with status prefix (e.g., 1-lead-john-doe)
    const channelName = generateChannelName(firstName, lastName, leadData.leadStatus)

    console.log('🔍 [SLACK SERVICE] Creating channel with name:', channelName)

    // Create the channel
    const createResult = await slack.createChannel({
      name: channelName,
      isPrivate: false,
      members: memberIds
    })

    console.log('🔍 [SLACK SERVICE] Channel creation result:', createResult)

    if (!createResult.success || !createResult.channelId) {
      console.error('❌ [SLACK SERVICE] Channel creation failed:', createResult.error)
      return {
        success: false,
        error: createResult.error || 'Failed to create channel'
      }
    }

    console.log('✅ [SLACK SERVICE] Channel created successfully:', createResult.channelId)

    const channelId = createResult.channelId
    const fullChannelName = createResult.channelName || channelName

    // Update the lead with the Slack channel info
    await prisma.lead.update({
      where: { id: leadData.leadId },
      data: {
        slackChannelId: channelId,
        slackChannelName: fullChannelName
      }
    })

    // Set channel topic with lead info
    const claimInfo = leadData.leadClaimNumber ? ` | Claim #${leadData.leadClaimNumber}` : ''
    const topic = `Lead: ${leadData.leadName}${claimInfo} | Status: ${leadData.leadStatus}`
    await slack.setChannelTopic(channelId, topic)

    // Send welcome message to the channel
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Format date of loss
    const dateOfLoss = leadData.leadDateOfLoss
      ? new Date(leadData.leadDateOfLoss).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'null'

    const welcomeMessage = {
      text: `🎉 Lead Channel Created: ${leadData.leadName}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🏠 Lead: ${leadData.leadName}`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Status:*\n${leadData.leadStatus}`
            },
            {
              type: "mrkdwn",
              text: `*Salesperson:*\n${leadData.assignedTo?.name || 'null'}`
            },
            {
              type: "mrkdwn",
              text: `*Phone:*\n${leadData.leadPhone || 'null'}`
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${leadData.leadEmail || 'null'}`
            },
            {
              type: "mrkdwn",
              text: `*Address:*\n${leadData.leadAddress || 'null'}`
            },
            {
              type: "mrkdwn",
              text: `*Claim #:*\n${leadData.leadClaimNumber || 'null'}`
            },
            {
              type: "mrkdwn",
              text: `*Insurance:*\n${leadData.leadInsuranceCompany || 'null'}`
            },
            {
              type: "mrkdwn",
              text: `*Date of Loss:*\n${dateOfLoss}`
            },
            {
              type: "mrkdwn",
              text: `*Damage Type:*\n${leadData.leadDamageType || 'null'}`
            },
            {
              type: "mrkdwn",
              text: `*Created By:*\n${leadData.createdBy.name}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Quick Links:*\n• <${appUrl}/leads/${leadData.leadId}|📊 View in CRM>\n• <https://maps.google.com/?q=${encodeURIComponent(leadData.leadAddress || '')}&t=k|📍 Street View>\n• <https://calendar.google.com|📅 Calendar>`
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "💬 Use this channel to discuss and collaborate on this lead"
            }
          ]
        }
      ]
    }

    // Send welcome message and pin it
    const welcomeResult = await slack.sendMessage(channelId, welcomeMessage)

    if (welcomeResult.success && welcomeResult.timestamp) {
      // Pin the welcome message
      const pinResult = await slack.pinMessage(channelId, welcomeResult.timestamp)
      if (pinResult.success) {
        console.log('✅ [SLACK SERVICE] Welcome message pinned')
      } else {
        console.error('❌ [SLACK SERVICE] Failed to pin welcome message:', pinResult.error)
      }
    }

    // Post Google Drive folder link (for Drive app unfurling)
    if (leadData.googleDriveFolderId || leadData.googleDriveUrl) {
      const driveUrl = leadData.googleDriveUrl || `https://drive.google.com/drive/folders/${leadData.googleDriveFolderId}`

      await slack.sendMessage(channelId, {
        text: `📁 *Lead Files*\n\nAll files for this lead are stored here:\n${driveUrl}\n\n_Tip: The Google Drive app will show file previews and updates in the Files tab._`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `📁 *Lead Files*\n\nAll files for this lead are stored in Google Drive:`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<${driveUrl}|📂 Open Drive Folder>`
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "_💡 Install the Google Drive app in Slack to see file previews and updates automatically_"
              }
            ]
          }
        ]
      })

      console.log('✅ [SLACK SERVICE] Google Drive folder link posted')
    }

    // Send Street View image if address is available
    if (leadData.leadAddress && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      try {
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(leadData.leadAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

        await slack.sendMessage(channelId, {
          text: `📍 Street View for ${leadData.leadName}`,
          blocks: [
            {
              type: "image",
              image_url: streetViewUrl,
              alt_text: `Street View: ${leadData.leadAddress}`
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `📍 *Address:* ${leadData.leadAddress}`
                }
              ]
            }
          ]
        })
      } catch (streetViewError) {
        console.error('Failed to send Street View:', streetViewError)
      }
    }

    console.log(`✅ Created Slack channel for lead ${leadData.leadId}: ${channelId} (#${fullChannelName})`)
    return {
      success: true,
      channelId,
      channelName: fullChannelName
    }
  } catch (error: any) {
    console.error("❌ [SLACK SERVICE] Error creating lead Slack channel:", error)
    console.error("❌ [SLACK SERVICE] Error stack:", error.stack)
    console.error("❌ [SLACK SERVICE] Error message:", error.message)
    if (error.data) {
      console.error("❌ [SLACK SERVICE] Error data:", error.data)
    }
    return {
      success: false,
      error: error.message || "Failed to create lead Slack channel"
    }
  }
}

/**
 * Send a message to a lead's Slack channel
 */
export async function sendLeadSlackMessage(
  leadId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the lead and its Slack channel ID
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        slackChannelId: true,
        firstName: true,
        lastName: true
      }
    })

    if (!lead?.slackChannelId) {
      return { success: false, error: "No Slack channel found for this lead" }
    }

    // Initialize Slack service
    const slack = new SlackService()

    const result = await slack.sendMessage(lead.slackChannelId, {
      text: message
    })

    if (result.success) {
      console.log(`✅ Sent message to Slack channel for lead ${leadId}`)
    } else {
      console.error(`❌ Failed to send message to Slack channel for lead ${leadId}:`, result.error)
    }

    return result
  } catch (error: any) {
    console.error("Error sending lead Slack message:", error)
    return {
      success: false,
      error: error.message || "Failed to send Slack message"
    }
  }
}

/**
 * Update lead Slack channel when lead status changes
 */
export async function updateLeadSlackStatus(
  leadId: string,
  oldStatus: string,
  newStatus: string,
  updatedBy: { name: string; email: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        slackChannelId: true,
        slackChannelName: true,
        firstName: true,
        lastName: true,
        claimNumber: true,
        address: true
      }
    })

    if (!lead?.slackChannelId) {
      return { success: false, error: "No Slack channel found for this lead" }
    }

    const slack = new SlackService()

    const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead'
    const claimInfo = lead.claimNumber ? ` (Claim #${lead.claimNumber})` : ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Rename channel with new status prefix
    const firstName = lead.firstName || 'unknown'
    const lastName = lead.lastName || ''
    const newChannelName = generateChannelName(firstName, lastName, newStatus)

    console.log(`🔍 [SLACK SERVICE] Renaming channel from ${lead.slackChannelName} to ${newChannelName}`)
    const renameResult = await slack.renameChannel(lead.slackChannelId, newChannelName)

    if (renameResult.success) {
      // Update database with new channel name
      await prisma.lead.update({
        where: { id: leadId },
        data: { slackChannelName: newChannelName }
      })
      console.log(`✅ [SLACK SERVICE] Channel renamed successfully`)
    } else {
      console.error(`❌ [SLACK SERVICE] Failed to rename channel: ${renameResult.error}`)
    }

    // Update channel topic
    const topicClaimInfo = lead.claimNumber ? ` | Claim #${lead.claimNumber}` : ''
    const topic = `Lead: ${leadName}${topicClaimInfo} | Status: ${newStatus}`
    await slack.setChannelTopic(lead.slackChannelId, topic)

    // Send status update message
    const statusMessage = {
      text: `🔄 Status Updated: ${leadName}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🔄 Status Updated"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Lead:*\n${leadName}${claimInfo}`
            },
            {
              type: "mrkdwn",
              text: `*Updated by:*\n${updatedBy.name}`
            },
            {
              type: "mrkdwn",
              text: `*Old Status:*\n${oldStatus}`
            },
            {
              type: "mrkdwn",
              text: `*New Status:*\n${newStatus}`
            }
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `⏰ ${new Date().toLocaleString()} | <${appUrl}/leads/${leadId}|View in CRM>`
            }
          ]
        }
      ]
    }

    const result = await slack.sendMessage(lead.slackChannelId, statusMessage)

    return result
  } catch (error: any) {
    console.error("Error updating lead Slack status:", error)
    return {
      success: false,
      error: error.message || "Failed to update lead Slack status"
    }
  }
}

/**
 * Get lead Slack channel information
 */
export async function getLeadSlackChannel(leadId: string): Promise<{ success: boolean; channel?: any; error?: string }> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { slackChannelId: true }
    })

    if (!lead?.slackChannelId) {
      return { success: false, error: "No Slack channel found for this lead" }
    }

    const slack = new SlackService()
    return await slack.getChannel(lead.slackChannelId)
  } catch (error: any) {
    console.error("Error getting lead Slack channel:", error)
    return {
      success: false,
      error: error.message || "Failed to get lead Slack channel"
    }
  }
}
