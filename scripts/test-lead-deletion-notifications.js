#!/usr/bin/env node

/**
 * Test script for lead deletion notifications
 * 
 * This script helps verify that the lead deletion notification system is working correctly.
 * It checks for admin users and provides guidance on testing the feature.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testLeadDeletionNotifications() {
  console.log('🧪 Testing Lead Deletion Notifications Setup...\n')

  try {
    // 1. Check for admin users
    console.log('1. Checking for admin users...')
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!')
      console.log('\nTo test notifications, you need at least one admin user:')
      console.log('1. Go to your database')
      console.log('2. Run this SQL command:')
      console.log('   UPDATE "User" SET role = \'ADMIN\' WHERE email = \'your-admin-email@example.com\';')
      console.log('3. Replace with an actual admin email address')
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`)
      adminUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`)
      })
    }

    // 2. Check for test leads
    console.log('\n2. Checking for test leads...')
    const testLeads = await prisma.lead.findMany({
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (testLeads.length === 0) {
      console.log('❌ No leads found!')
      console.log('\nTo test notifications:')
      console.log('1. Create some test leads in your CRM')
      console.log('2. Then try deleting one to trigger notifications')
    } else {
      console.log(`✅ Found ${testLeads.length} lead(s) for testing:`)
      testLeads.forEach(lead => {
        const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed'
        console.log(`   - ${name} (${lead.email || 'No email'}) - ${lead.status}`)
      })
    }

    // 3. Check environment variables
    console.log('\n3. Checking environment setup...')
    const requiredEnvVars = [
      'NEXTAUTH_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:')
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`)
      })
    } else {
      console.log('✅ Environment variables look good')
    }

    // 4. Testing instructions
    console.log('\n4. Testing Instructions:')
    console.log('\nTo test the notification system:')
    console.log('1. Ensure you have admin users (see step 1)')
    console.log('2. Log in as a non-admin user')
    console.log('3. Navigate to a lead detail page')
    console.log('4. Click the delete button and confirm')
    console.log('5. Check admin email inboxes for notifications')
    console.log('\nAlternative test via API:')
    console.log('1. Get a valid session token')
    console.log('2. Make DELETE request to /api/leads/[lead-id]')
    console.log('3. Check admin emails for notifications')

    // 5. Debug information
    console.log('\n5. Debug Information:')
    console.log(`- Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`)
    console.log(`- Node environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`- Base URL: ${process.env.NEXTAUTH_URL || 'Not set'}`)

  } catch (error) {
    console.error('❌ Error during testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testLeadDeletionNotifications()
  .then(() => {
    console.log('\n✅ Test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }) 