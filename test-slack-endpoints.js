/**
 * Test script to verify Slack endpoints are accessible
 * Run with: node test-slack-endpoints.js
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

console.log('🔍 Testing Slack endpoints...\n')
console.log(`Base URL: ${baseUrl}\n`)

async function testEndpoint(name, url) {
  try {
    console.log(`Testing ${name}...`)
    console.log(`URL: ${url}`)

    const response = await fetch(url)
    const data = await response.json()

    console.log(`✅ Status: ${response.status}`)
    console.log(`✅ Response:`, JSON.stringify(data, null, 2))
    console.log('')

    return true
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`)
    console.log('')
    return false
  }
}

async function runTests() {
  console.log('=' .repeat(60))
  console.log('SLACK ENDPOINT TESTS')
  console.log('=' .repeat(60))
  console.log('')

  await testEndpoint('Commands Endpoint (GET)', `${baseUrl}/api/slack/commands`)
  await testEndpoint('Interactivity Endpoint (GET)', `${baseUrl}/api/slack/interactivity`)

  console.log('=' .repeat(60))
  console.log('CONFIGURATION TO USE IN SLACK APP')
  console.log('=' .repeat(60))
  console.log('')
  console.log('Slash Commands:')
  console.log(`  Request URL: ${baseUrl}/api/slack/commands`)
  console.log('')
  console.log('Interactivity & Shortcuts:')
  console.log(`  Request URL: ${baseUrl}/api/slack/interactivity`)
  console.log('')
  console.log('Required Scopes:')
  console.log('  - channels:manage')
  console.log('  - channels:read')
  console.log('  - chat:write')
  console.log('  - commands')
  console.log('  - users:read')
  console.log('  - users:read.email')
  console.log('  - pins:write')
  console.log('')
}

runTests().catch(console.error)
