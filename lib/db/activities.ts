import { prisma } from './prisma'
import { Activity, ActivityType, ActivityStatus } from '@prisma/client'

export interface ActivityWithUser extends Activity {
  userName?: string
}

/**
 * Creates a new activity record
 */
export async function createActivity(data: {
  type: ActivityType
  title: string
  description?: string | null
  userId: string
  leadId?: string | null
}): Promise<Activity> {
  try {
    const activity = await prisma.activity.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description || null,
        userId: data.userId,
        leadId: data.leadId || null,
      }
    })

    console.log("Activity created successfully:", activity)
    return activity
  } catch (error) {
    console.error("Error creating activity:", error)
    throw new Error(`Failed to create activity: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Gets recent activities with user information
 */
export async function getRecentActivities(limit = 5): Promise<ActivityWithUser[]> {
  try {
    const activities = await prisma.activity.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    return activities.map(activity => ({
      ...activity,
      userName: activity.user.name
    }))
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    throw new Error(`Failed to fetch recent activities: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Gets all activities with pagination and user information
 */
export async function getAllActivities(page = 1, limit = 50): Promise<ActivityWithUser[]> {
  try {
    const skip = (page - 1) * limit
    
    const activities = await prisma.activity.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        },
        lead: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return activities.map(activity => ({
      ...activity,
      userName: activity.user.name
    }))
  } catch (error) {
    console.error("Error fetching all activities:", error)
    throw new Error(`Failed to fetch activities: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Gets all activities for a specific lead with user information
 */
export async function getActivitiesByLeadId(leadId: string): Promise<ActivityWithUser[]> {
  try {
    const activities = await prisma.activity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    return activities.map(activity => ({
      ...activity,
      userName: activity.user.name
    }))
  } catch (error) {
    console.error("Error fetching lead activities:", error)
    throw new Error(`Failed to fetch lead activities: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
} 