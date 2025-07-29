import { PrismaClient, UserRole } from '@prisma/client'
import { createLeadChatSpace } from '../lib/services/leadChatIntegration'

const prisma = new PrismaClient()

// Mock session for the script - you'll need to replace with actual session data
const mockSession = {
  accessToken: process.env.GOOGLE_ACCESS_TOKEN,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  user: {
    id: 'script-user',
    name: 'Migration Script',
    email: 'script@example.com'
  }
}

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
      return null
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
    console.log('🚀 Starting Google Chat space creation for existing leads...')

    // Check environment variables
    if (!process.env.GOOGLE_ACCESS_TOKEN) {
      console.error('❌ Missing Google access token!')
      console.error('Please set GOOGLE_ACCESS_TOKEN environment variable')
      console.error('You can get this from your browser session or Google OAuth flow')
      process.exit(1)
    }

    // Get all admin users
    console.log('📋 Fetching admin users...')
    const adminUsers = await getAdminUsers()
    console.log(`✅ Found ${adminUsers.length} admin users`)

    // Get all leads that don't have a chat space
    console.log('📋 Fetching leads without chat spaces...')
    const leads = await prisma.lead.findMany({
      where: {
        googleChatSpaceId: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        address: true,
        status: true,
        assignedToId: true,
        createdAt: true,
        googleChatSpaceId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`✅ Found ${leads.length} leads without chat spaces`)

    if (leads.length === 0) {
      console.log('🎉 All leads already have chat spaces!')
      return
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process leads in batches
    const batchSize = 3 // Smaller batch size for API limits
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)} (${batch.length} leads)`)

      for (const lead of batch) {
        try {
          console.log(`\n🔄 Creating chat space for lead: ${lead.firstName || ''} ${lead.lastName || ''} (${lead.id})`)

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

          const result = await createLeadChatSpace({
            leadId: lead.id,
            leadName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead',
            leadEmail: lead.email || undefined,
            leadAddress: lead.address || undefined,
            leadStatus: lead.status,
            createdBy: {
              id: creator?.id || 'unknown',
              name: creator?.name || 'Unknown User',
              email: creator?.email || ''
            },
            assignedTo
          }, mockSession)

          if (result.success) {
            console.log(`   ✅ Chat space created: ${result.spaceId}`)
            successCount++
          } else {
            console.log(`   ❌ Failed: ${result.error}`)
            errorCount++
            errors.push(`Lead ${lead.id}: ${result.error}`)
          }

          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (error: any) {
          console.log(`   ❌ Error: ${error.message}`)
          errorCount++
          errors.push(`Lead ${lead.id}: ${error.message}`)
        }
      }

      // Add delay between batches
      if (i + batchSize < leads.length) {
        console.log('\n⏳ Waiting 5 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    // Summary
    console.log('\n📊 Summary:')
    console.log(`✅ Successfully created: ${successCount} chat spaces`)
    console.log(`❌ Failed: ${errorCount} leads`)
    console.log(`📈 Total processed: ${leads.length} leads`)

    if (errors.length > 0) {
      console.log('\n❌ Errors:')
      errors.forEach(error => console.log(`   - ${error}`))
    }

    if (successCount > 0) {
      console.log('\n🎉 Successfully created chat spaces for existing leads!')
      console.log('💡 You can now use the chat widget in lead detail pages.')
    }

  } catch (error: any) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
main().catch(console.error) 