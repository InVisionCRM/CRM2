import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get the most recent activity
    const lastActivity = await prisma.activity.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true,
        title: true,
        type: true,
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (!lastActivity) {
      return NextResponse.json({ 
        timeAgo: 'No recent activity',
        lastActivity: null 
      })
    }

    const timeAgo = formatDistanceToNow(lastActivity.createdAt, { addSuffix: true })

    return NextResponse.json({ 
      timeAgo,
      lastActivity: {
        title: lastActivity.title,
        type: lastActivity.type,
        userName: lastActivity.user?.name,
        createdAt: lastActivity.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching last activity:', error)
    return NextResponse.json({ error: 'Failed to fetch last activity' }, { status: 500 })
  }
} 