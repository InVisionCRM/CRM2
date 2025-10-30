import { PrismaClient, UserRole } from '@prisma/client'
import { createLeadSlackChannel } from '../lib/services/leadSlackIntegration'

const prisma = new PrismaClient()

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

async function getLeadCreator(leadId: string) {
  try {
    const firstActivity = await prisma.activity.findFirst({
      where: {
        leadId: leadId,
        type: 'LEAD_CREATED'
      },
      select: {
        userId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (!firstActivity) {
      // If no LEAD_CREATED activity, try to find any activity
      const anyActivity = await prisma.activity.findFirst({
        where: {
          leadId: leadId
        },
        select: {
          userId: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      if (!anyActivity) {
        return null
      }

      const creator = await prisma.user.findUnique({
        where: { id: anyActivity.userId },
        select: {
          id: true,
          name: true,
          email: true
        }
      })

      return creator
    }

    const creator = await prisma.user.findUnique({
      where: { id: firstActivity.userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return creator
  } catch (error) {
    console.error(`Error fetching lead creator for ${leadId}:`, error)
    return null
  }
}

async function getAssignedUser(assignedToId: string) {
  try {
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return assignedUser
  } catch (error) {
    console.error(`Error fetching assigned user ${assignedToId}:`, error)
    return null
  }
}

async function main() {
  try {
    console.log('🚀 Starting Slack channel creation for existing leads...')

    // Check environment variables
    if (!process.env.SLACK_BOT_TOKEN) {
      console.error('❌ Missing Slack bot token!')
      console.error('Please set SLACK_BOT_TOKEN environment variable')
      process.exit(1)
    }

    // Get all admin users
    console.log('📋 Fetching admin users...')
    const adminUsers = await getAdminUsers()
    console.log(`✅ Found ${adminUsers.length} admin users`)

    // Get all leads that don't have a Slack channel
    console.log('📋 Fetching leads without Slack channels...')
    const leads = await prisma.lead.findMany({
      where: {
        slackChannelId: null
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
        googleDriveFolderId: true,
        googleDriveUrl: true,
        createdAt: true,
        slackChannelId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`✅ Found ${leads.length} leads without Slack channels`)

    if (leads.length === 0) {
      console.log('🎉 All leads already have Slack channels!')
      return
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process leads in batches to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)} (${batch.length} leads)`)

      for (const lead of batch) {
        try {
          console.log(`\n🔄 Creating Slack channel for lead: ${lead.firstName || ''} ${lead.lastName || ''} (${lead.id})`)

          // Get lead creator
          const creator = await getLeadCreator(lead.id)
          if (creator) {
            console.log(`   👤 Creator: ${creator.name} (${creator.email})`)
          }

          // Get assigned user
          let assignedTo = undefined
          if (lead.assignedToId) {
            const assignedUser = await getAssignedUser(lead.assignedToId)
            if (assignedUser) {
              console.log(`   👤 Assigned: ${assignedUser.name} (${assignedUser.email})`)
              assignedTo = {
                id: assignedUser.id,
                name: assignedUser.name || 'Unknown User',
                email: assignedUser.email || ''
              }
            }
          }

          // If no creator found, use first admin as fallback
          const finalCreator = creator || (adminUsers[0] ? {
            id: adminUsers[0].id,
            name: adminUsers[0].name || 'Admin',
            email: adminUsers[0].email || ''
          } : {
            id: 'unknown',
            name: 'System',
            email: 'system@example.com'
          })

          const result = await createLeadSlackChannel({
            leadId: lead.id,
            leadName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead',
            leadEmail: lead.email || undefined,
            leadPhone: lead.phone || undefined,
            leadAddress: lead.address || undefined,
            leadStatus: lead.status,
            leadClaimNumber: lead.claimNumber || undefined,
            leadInsuranceCompany: lead.insuranceCompany || undefined,
            leadDateOfLoss: lead.dateOfLoss || undefined,
            leadDamageType: lead.damageType || undefined,
            googleDriveFolderId: lead.googleDriveFolderId || undefined,
            googleDriveUrl: lead.googleDriveUrl || undefined,
            createdBy: finalCreator,
            assignedTo
          })

          if (result.success) {
            console.log(`   ✅ Slack channel created: #${result.channelName} (${result.channelId})`)
            successCount++
          } else {
            console.log(`   ❌ Failed: ${result.error}`)
            errorCount++
            errors.push(`Lead ${lead.id} (${lead.firstName} ${lead.lastName}): ${result.error}`)
          }

          // Add delay between requests to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1500))

        } catch (error: any) {
          console.log(`   ❌ Error: ${error.message}`)
          errorCount++
          errors.push(`Lead ${lead.id} (${lead.firstName} ${lead.lastName}): ${error.message}`)
        }
      }

      // Add delay between batches
      if (i + batchSize < leads.length) {
        console.log('\n⏳ Waiting 5 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Successfully created: ${successCount} Slack channels`)
    console.log(`❌ Failed: ${errorCount} leads`)
    console.log(`📈 Total processed: ${leads.length} leads`)

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:')
      errors.forEach(error => console.log(`   - ${error}`))
    }

    if (successCount > 0) {
      console.log('\n🎉 Successfully created Slack channels for existing leads!')
      console.log('💡 You can now collaborate on leads in their dedicated Slack channels.')
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
