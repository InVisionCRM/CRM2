#!/usr/bin/env node

/**
 * Script to check and create test users in the database
 */

import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAndCreateUsers() {
  console.log('🔍 Checking users in database...\n')

  try {
    // 1. Check existing users
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`📊 Found ${existingUsers.length} existing users:`)
    if (existingUsers.length === 0) {
      console.log('   ❌ No users found in database!')
    } else {
      existingUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
      })
    }

    // 2. If no users exist, create some test users
    if (existingUsers.length === 0) {
      console.log('\n🔧 Creating test users...')
      
      const testUsers = [
        {
          name: 'Admin User',
          email: 'admin@test.com',
          role: UserRole.ADMIN
        },
        {
          name: 'Sales Manager',
          email: 'manager@test.com',
          role: UserRole.MANAGER
        },
        {
          name: 'Sales Rep 1',
          email: 'sales1@test.com',
          role: UserRole.USER
        },
        {
          name: 'Sales Rep 2',
          email: 'sales2@test.com',
          role: UserRole.USER
        }
      ]

      for (const userData of testUsers) {
        try {
          const user = await prisma.user.create({
            data: userData
          })
          console.log(`   ✅ Created: ${user.name} (${user.email}) - ${user.role}`)
        } catch (error) {
          console.log(`   ❌ Failed to create ${userData.name}: ${error.message}`)
        }
      }
    }

    // 3. Final count
    const finalUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log(`\n📈 Final user count: ${finalUsers.length}`)
    
    if (finalUsers.length > 0) {
      console.log('\n🎉 Users are now available for the user filter!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndCreateUsers()
