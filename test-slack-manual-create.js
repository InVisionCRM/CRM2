// Manual test script to create a Slack channel for a lead
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createLeadSlackChannel } from './lib/services/leadSlackIntegration.js'

const prisma = new PrismaClient()

async function testCreateSlackChannel() {
  try {
    console.log('🔍 Testing manual Slack channel creation...\n')

    // Get the most recent lead
    const lead = await prisma.lead.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: true,
      }
    })

    if (!lead) {
      console.error('❌ No leads found in the database')
      process.exit(1)
    }

    console.log('📊 Most recent lead:', {
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      address: lead.address,
      status: lead.status,
      hasSlackChannel: !!lead.slackChannelId,
      slackChannelId: lead.slackChannelId || 'None'
    })

    if (lead.slackChannelId) {
      console.log('\n⚠️  This lead already has a Slack channel')
      console.log('Do you want to try creating another one? (It may fail due to duplicate name)')
    }

    // Get the first admin user for testing
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.error('❌ No admin user found')
      process.exit(1)
    }

    console.log('\n👤 Using admin user as creator:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email
    })

    // Prepare lead data
    const leadData = {
      leadId: lead.id,
      leadName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
      leadEmail: lead.email || undefined,
      leadAddress: lead.address || undefined,
      leadStatus: lead.status,
      leadClaimNumber: lead.claimNumber || undefined,
      createdBy: {
        id: adminUser.id,
        name: adminUser.name || 'Unknown User',
        email: adminUser.email || ''
      },
      assignedTo: lead.assignedTo ? {
        id: lead.assignedTo.id,
        name: lead.assignedTo.name || 'Unknown User',
        email: lead.assignedTo.email || ''
      } : undefined
    }

    console.log('\n🚀 Calling createLeadSlackChannel...\n')
    console.log('=' .repeat(80))

    const result = await createLeadSlackChannel(leadData)

    console.log('=' .repeat(80))
    console.log('\n📊 Result:', result)

    if (result.success) {
      console.log('\n✅ SUCCESS! Slack channel created!')
      console.log(`   Channel ID: ${result.channelId}`)
      console.log(`   Channel Name: ${result.channelName}`)
      console.log(`   View in Slack: https://invisionconst-qx25593.slack.com/channels/${result.channelName}`)
    } else {
      console.log('\n❌ FAILED to create Slack channel')
      console.log(`   Error: ${result.error}`)
    }

  } catch (error) {
    console.error('\n❌ Test script error:', error)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testCreateSlackChannel()
