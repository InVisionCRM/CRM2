import { PrismaClient } from '@prisma/client'
import { SlackService } from '../lib/services/slack'
import { generateChannelName } from '../lib/services/leadSlackIntegration'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🚀 Renaming Slack channels with status prefixes...')

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
        status: true,
        slackChannelId: true,
        slackChannelName: true
      },
      orderBy: {
        status: 'asc'
      }
    })

    console.log(`✅ Found ${leads.length} leads with Slack channels`)

    if (leads.length === 0) {
      console.log('🎉 No leads with Slack channels found!')
      return
    }

    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const lead of leads) {
      try {
        const firstName = lead.firstName || 'unknown'
        const lastName = lead.lastName || ''
        const leadName = `${firstName} ${lastName}`.trim()

        // Generate new channel name with status prefix
        const newChannelName = generateChannelName(firstName, lastName, lead.status)

        console.log(`\n🔄 Lead: ${leadName} (Status: ${lead.status})`)
        console.log(`   Current: ${lead.slackChannelName}`)
        console.log(`   New:     ${newChannelName}`)

        if (!lead.slackChannelId) {
          console.log('   ⚠️ Skipping - no channel ID')
          skippedCount++
          continue
        }

        // Check if channel already has correct name
        if (lead.slackChannelName === newChannelName) {
          console.log('   ✓ Already has correct name, skipping')
          skippedCount++
          continue
        }

        // Rename the channel
        const renameResult = await slack.renameChannel(lead.slackChannelId, newChannelName)

        if (!renameResult.success) {
          console.log(`   ❌ Failed to rename: ${renameResult.error}`)
          errorCount++
          errors.push(`${leadName}: ${renameResult.error}`)
          continue
        }

        // Update database with new channel name
        await prisma.lead.update({
          where: { id: lead.id },
          data: { slackChannelName: newChannelName }
        })

        console.log(`   ✅ Renamed successfully`)
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
    console.log(`✅ Successfully renamed: ${successCount} channels`)
    console.log(`⏭️  Skipped (already correct): ${skippedCount} channels`)
    console.log(`❌ Failed: ${errorCount} channels`)
    console.log(`📈 Total processed: ${leads.length} channels`)

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:')
      errors.forEach(error => console.log(`   - ${error}`))
    }

    if (successCount > 0) {
      console.log('\n🎉 Successfully renamed Slack channels!')
      console.log('💡 Channels will now auto-sort by status in Slack.')
      console.log('\n📋 Status Order:')
      console.log('   1-fup   - Follow Ups')
      console.log('   2-sign  - Signed Contract')
      console.log('   3-sched - Scheduled')
      console.log('   4-color - Colors')
      console.log('   5-acv   - ACV')
      console.log('   6-job   - Job')
      console.log('   7-comp  - Completed Jobs')
      console.log('   8-zero  - Zero Balance')
      console.log('   9-deny  - Denied')
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
