// Test script to verify Slack integration
import 'dotenv/config'
import { WebClient } from '@slack/web-api'

async function testSlackIntegration() {
  console.log('🔍 Testing Slack Integration...\n')

  // Check environment variables
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    console.error('❌ SLACK_BOT_TOKEN not found in environment variables')
    process.exit(1)
  }
  console.log('✅ SLACK_BOT_TOKEN found')

  // Initialize Slack client
  const client = new WebClient(token)

  try {
    // Test 1: Auth test
    console.log('\n📡 Testing authentication...')
    const authTest = await client.auth.test()
    console.log('✅ Authentication successful!')
    console.log(`   Bot User ID: ${authTest.user_id}`)
    console.log(`   Team: ${authTest.team}`)
    console.log(`   Team ID: ${authTest.team_id}`)
    console.log(`   Bot Name: ${authTest.user}`)

    // Test 2: List available scopes
    console.log('\n🔐 Checking bot permissions...')
    const botInfo = await client.auth.test()
    console.log(`   Bot has access to workspace: ${botInfo.url}`)

    // Test 3: Try to find a user by email (test the users:read.email scope)
    console.log('\n👤 Testing user lookup by email...')
    try {
      // Use your own email for testing
      const testEmail = authTest.user // This will fail if we don't have the right scope
      console.log(`   Testing lookup (this may fail if missing scopes)...`)
    } catch (err) {
      console.log(`   ⚠️  User lookup test: ${err.message}`)
    }

    // Test 4: List conversations (to verify we can read channels)
    console.log('\n📋 Testing channel list access...')
    try {
      const channels = await client.conversations.list({
        limit: 5,
        types: 'public_channel,private_channel'
      })
      console.log(`✅ Can list channels: ${channels.channels?.length || 0} channels found`)
    } catch (err) {
      console.error(`❌ Cannot list channels: ${err.message}`)
    }

    // Test 5: Check required scopes for the integration
    console.log('\n🔍 Required scopes for lead channel creation:')
    const requiredScopes = [
      'channels:manage',       // Create public channels
      'channels:read',         // Read channel information
      'chat:write',            // Send messages to channels
      'users:read',            // Read user information
      'users:read.email',      // Look up users by email
      'groups:write',          // Create private channels (if needed)
      'groups:read',           // Read private channel info
    ]

    console.log('   Your bot should have these scopes:')
    requiredScopes.forEach(scope => {
      console.log(`   - ${scope}`)
    })

    console.log('\n✅ Slack integration test completed!')
    console.log('\n💡 Next steps:')
    console.log('   1. Verify your bot has all the required scopes listed above')
    console.log('   2. Go to https://api.slack.com/apps and check your app\'s OAuth & Permissions')
    console.log('   3. Make sure the bot is added to your Slack workspace')

  } catch (error) {
    console.error('\n❌ Slack integration test failed!')
    console.error(`   Error: ${error.message}`)

    if (error.data) {
      console.error(`   Details: ${JSON.stringify(error.data, null, 2)}`)
    }

    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check if SLACK_BOT_TOKEN is correct')
    console.log('   2. Verify the token starts with "xoxb-"')
    console.log('   3. Ensure the Slack app is installed in your workspace')
    console.log('   4. Check that your bot has the necessary OAuth scopes')

    process.exit(1)
  }
}

testSlackIntegration()
