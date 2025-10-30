import { PrismaClient } from '@prisma/client'
import { SlackService } from '../lib/services/slack'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 Populating existing Slack channels with lead information...')

    // Check environment variables
    if (!process.env.SLACK_BOT_TOKEN) {
      console.error('❌ Missing Slack bot token!')
      console.error('Please set SLACK_BOT_TOKEN environment variable')
      process.exit(1)
    }

    const slack = new SlackService()

    // Get all leads that have Slack channels
    console.log('📋 Fetching leads with Slack channels...')
    const leads = await prisma.lead.findMany({
      where: {
        slackChannelId: {
          not: null
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        claimNumber: true,
        insuranceCompany: true,
        dateOfLoss: true,
        damageType: true,
        assignedToId: true,
        slackChannelId: true,
        slackChannelName: true,
        assignedTo: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`✅ Found ${leads.length} leads with Slack channels`)

    if (leads.length === 0) {
      console.log('🎉 No leads with Slack channels found!')
      return
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const lead of leads) {
      try {
        const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead'
        console.log(`\n🔄 Populating channel for: ${leadName} (${lead.slackChannelName})`)

        if (!lead.slackChannelId) {
          console.log('   ⚠️ Skipping - no channel ID')
          continue
        }

        // Set channel topic
        const claimInfo = lead.claimNumber ? ` | Claim #${lead.claimNumber}` : ''
        const topic = `Lead: ${leadName}${claimInfo} | Status: ${lead.status}`

        const topicResult = await slack.setChannelTopic(lead.slackChannelId, topic)
        if (!topicResult.success) {
          console.log(`   ⚠️ Failed to set topic: ${topicResult.error}`)
        }

        // Send welcome message
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

        // Format date of loss
        const dateOfLoss = lead.dateOfLoss
          ? new Date(lead.dateOfLoss).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'null'

        const welcomeMessage = {
          text: `🎉 Lead Channel: ${leadName}`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `🏠 Lead: ${leadName}`
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Status:*\n${lead.status}`
                },
                {
                  type: "mrkdwn",
                  text: `*Salesperson:*\n${lead.assignedTo?.name || 'null'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Phone:*\n${lead.phone || 'null'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Email:*\n${lead.email || 'null'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Address:*\n${lead.address || 'null'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Claim #:*\n${lead.claimNumber || 'null'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Insurance:*\n${lead.insuranceCompany || 'null'}`
                },
                {
                  type: "mrkdwn",
                  text: `*Date of Loss:*\n${dateOfLoss}`
                },
                {
                  type: "mrkdwn",
                  text: `*Damage Type:*\n${lead.damageType || 'null'}`
                }
              ]
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Quick Links:*\n• <${appUrl}/leads/${lead.id}|📊 View in CRM>\n• <https://maps.google.com/?q=${encodeURIComponent(lead.address || '')}&t=k|📍 Street View>\n• <https://calendar.google.com|📅 Calendar>`
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

        const messageResult = await slack.sendMessage(lead.slackChannelId, welcomeMessage)
        if (!messageResult.success) {
          console.log(`   ❌ Failed to send message: ${messageResult.error}`)
          errorCount++
          errors.push(`${leadName}: ${messageResult.error}`)
          continue
        }

        // Send Street View if address is available
        if (lead.address && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          try {
            const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(lead.address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

            await slack.sendMessage(lead.slackChannelId, {
              text: `📍 Street View for ${leadName}`,
              blocks: [
                {
                  type: "image",
                  image_url: streetViewUrl,
                  alt_text: `Street View: ${lead.address}`
                },
                {
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: `📍 *Address:* ${lead.address}`
                    }
                  ]
                }
              ]
            })
          } catch (streetViewError) {
            console.log('   ⚠️ Failed to send Street View (continuing...)')
          }
        }

        console.log(`   ✅ Channel populated successfully`)
        successCount++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`)
        errorCount++
        const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
        errors.push(`${leadName}: ${error.message}`)
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Successfully populated: ${successCount} channels`)
    console.log(`❌ Failed: ${errorCount} channels`)
    console.log(`📈 Total processed: ${leads.length} channels`)

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:')
      errors.forEach(error => console.log(`   - ${error}`))
    }

    if (successCount > 0) {
      console.log('\n🎉 Successfully populated Slack channels!')
    }

  } catch (error: any) {
    console.error('❌ Script failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main().catch(console.error)
