import { PrismaClient, UserRole } from '@prisma/client'
import { GoogleChatService } from '../lib/services/googleChat'

const prisma = new PrismaClient()

interface LeadData {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  address: string | null
  status: string
  assignedToId: string | null
  createdAt: Date
  googleChatSpaceId: string | null
}

interface UserData {
  id: string
  name: string | null
  email: string | null
}

async function getAdminUsers(): Promise<UserData[]> {
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

async function getLeadCreator(leadId: string): Promise<UserData | null> {
  try {
    // Get the first activity for this lead to determine creator
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

async function getAssignedUser(assignedToId: string): Promise<UserData | null> {
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

async function createChatSpaceForLead(
  lead: LeadData,
  adminUsers: UserData[],
  creator: UserData | null,
  assignedUser: UserData | null,
  googleChat: GoogleChatService
): Promise<{ success: boolean; spaceId?: string; error?: string }> {
  try {
    // Prepare member list
    const members: string[] = []
    const memberEmails = new Set<string>()

    // Add all admins
    adminUsers.forEach(admin => {
      if (admin.email && !memberEmails.has(admin.email)) {
        members.push(admin.email)
        memberEmails.add(admin.email)
      }
    })

    // Add the lead creator
    if (creator?.email && !memberEmails.has(creator.email)) {
      members.push(creator.email)
      memberEmails.add(creator.email)
    }

    // Add the assigned user if different from creator
    if (assignedUser?.email && 
        assignedUser.email !== creator?.email && 
        !memberEmails.has(assignedUser.email)) {
      members.push(assignedUser.email)
      memberEmails.add(assignedUser.email)
    }

    // Create chat space
    const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead'
    const spaceName = `Lead: ${leadName} - ${lead.id}`
    const spaceDescription = `Chat room for lead: ${leadName}
    
Lead Details:
- Email: ${lead.email || 'Not provided'}
- Address: ${lead.address || 'Not provided'}
- Status: ${lead.status}
- Created: ${lead.createdAt.toLocaleDateString()}
${creator ? `- Created by: ${creator.name}` : ''}
${assignedUser ? `- Assigned to: ${assignedUser.name}` : ''}

CRM Link: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/leads/${lead.id}`

    const result = await googleChat.createSpace({
      displayName: spaceName,
      description: spaceDescription,
      members
    })

    if (result.success && result.spaceId) {
      // Update the lead with the chat space ID
      await prisma.lead.update({
        where: { id: lead.id },
        data: { googleChatSpaceId: result.spaceId }
      })

      // Send welcome message to the chat
      const welcomeMessage = `🎉 **Existing Lead Chat Space Created**

**Lead Details:**
- **Name:** ${leadName}
- **Email:** ${lead.email || 'Not provided'}
- **Address:** ${lead.address || 'Not provided'}
- **Status:** ${lead.status}
- **Created:** ${lead.createdAt.toLocaleDateString()}
${creator ? `- **Created by:** ${creator.name}` : ''}
${assignedUser ? `- **Assigned to:** ${assignedUser.name}` : ''}

**Team Members Added:**
${members.map(email => `• ${email}`).join('\n')}

This chat room has been created for an existing lead. You'll receive notifications for status changes, appointments, and other updates.

**Quick Actions:**
• View lead in CRM: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/leads/${lead.id}
• Update lead status
• Schedule appointments
• Add notes and activities`

      await googleChat.sendMessage(result.spaceId, {
        text: welcomeMessage
      })

      return { success: true, spaceId: result.spaceId }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error(`Error creating chat space for lead ${lead.id}:`, error)
    return {
      success: false,
      error: error.message || "Failed to create chat space"
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting Google Chat space creation for existing leads...')

    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('❌ Missing Google API credentials!')
      console.error('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables')
      process.exit(1)
    }

    // Initialize Google Chat service
    const googleChat = new GoogleChatService({
      clientId,
      clientSecret
    })

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

    // Process leads in batches to avoid overwhelming the API
    const batchSize = 5
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
          let assignedUser = null
          if (lead.assignedToId) {
            assignedUser = await getAssignedUser(lead.assignedToId)
            if (assignedUser) {
              console.log(`   👤 Assigned: ${assignedUser.name} (${assignedUser.email})`)
            }
          }

          const result = await createChatSpaceForLead(
            lead,
            adminUsers,
            creator,
            assignedUser,
            googleChat
          )

          if (result.success) {
            console.log(`   ✅ Chat space created: ${result.spaceId}`)
            successCount++
          } else {
            console.log(`   ❌ Failed: ${result.error}`)
            errorCount++
            errors.push(`Lead ${lead.id}: ${result.error}`)
          }

          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error: any) {
          console.log(`   ❌ Error: ${error.message}`)
          errorCount++
          errors.push(`Lead ${lead.id}: ${error.message}`)
        }
      }

      // Add delay between batches
      if (i + batchSize < leads.length) {
        console.log('\n⏳ Waiting 2 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 2000))
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