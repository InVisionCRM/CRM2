import { prisma } from './prisma'
import { Visit, KnockStatus, Prisma } from '@prisma/client'

interface CreateVisitInput {
  address: string
  latitude: number
  longitude: number
  status: KnockStatus
  notes?: string | null
  followUpDate?: Date | null
  followUpTime?: string | null
  followUpNotes?: string | null
  leadId?: string | null
  userId?: string | null
}

interface UpdateVisitInput extends Partial<CreateVisitInput> {}

interface GetVisitsOptions {
  address?: string
  leadId?: string
  userId?: string
  status?: KnockStatus
}

/**
 * Create a new visit
 */
export async function createVisit(data: CreateVisitInput): Promise<Visit> {
  try {
    const visit = await prisma.visit.create({
      data: {
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status,
        notes: data.notes || null,
        followUpDate: data.followUpDate || null,
        followUpTime: data.followUpTime || null,
        followUpNotes: data.followUpNotes || null,
        leadId: data.leadId || null,
        userId: data.userId || null,
      },
      include: {
        lead: true,
        user: true,
      }
    })

    console.log("Visit created successfully:", visit)
    return visit
  } catch (error) {
    console.error("Error creating visit:", error)
    throw new Error(`Failed to create visit: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get visits with optional filters
 */
export async function getVisits(options?: GetVisitsOptions): Promise<Visit[]> {
  try {
    const where: Prisma.VisitWhereInput = {}

    if (options?.address) {
      where.address = options.address
    }

    if (options?.leadId) {
      where.leadId = options.leadId
    }

    if (options?.userId) {
      where.userId = options.userId
    }

    if (options?.status) {
      where.status = options.status
    }

    const visits = await prisma.visit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        lead: true,
        user: true,
      }
    })

    return visits
  } catch (error) {
    console.error("Error fetching visits:", error)
    throw new Error(`Failed to fetch visits: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get a single visit by ID
 */
export async function getVisitById(id: string): Promise<Visit | null> {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        lead: true,
        user: true,
      }
    })

    return visit
  } catch (error) {
    console.error(`Error fetching visit ${id}:`, error)
    throw new Error(`Failed to fetch visit: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get visits by address
 */
export async function getVisitsByAddress(address: string): Promise<Visit[]> {
  try {
    const visits = await prisma.visit.findMany({
      where: { address },
      orderBy: { createdAt: 'desc' },
      include: {
        lead: true,
        user: true,
      }
    })

    return visits
  } catch (error) {
    console.error(`Error fetching visits for address ${address}:`, error)
    throw new Error(`Failed to fetch visits: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Update an existing visit
 */
export async function updateVisit(id: string, data: UpdateVisitInput): Promise<Visit> {
  try {
    const visit = await prisma.visit.update({
      where: { id },
      data: {
        ...(data.address !== undefined && { address: data.address }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.followUpDate !== undefined && { followUpDate: data.followUpDate }),
        ...(data.followUpTime !== undefined && { followUpTime: data.followUpTime }),
        ...(data.followUpNotes !== undefined && { followUpNotes: data.followUpNotes }),
        ...(data.leadId !== undefined && { leadId: data.leadId }),
        ...(data.userId !== undefined && { userId: data.userId }),
      },
      include: {
        lead: true,
        user: true,
      }
    })

    console.log("Visit updated successfully:", visit)
    return visit
  } catch (error) {
    console.error(`Error updating visit ${id}:`, error)
    throw new Error(`Failed to update visit: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Delete a visit
 */
export async function deleteVisit(id: string): Promise<Visit> {
  try {
    const visit = await prisma.visit.delete({
      where: { id },
      include: {
        lead: true,
        user: true,
      }
    })

    console.log("Visit deleted successfully:", visit)
    return visit
  } catch (error) {
    console.error(`Error deleting visit ${id}:`, error)
    throw new Error(`Failed to delete visit: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get visits for a specific lead
 */
export async function getVisitsByLeadId(leadId: string): Promise<Visit[]> {
  try {
    const visits = await prisma.visit.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: {
        lead: true,
        user: true,
      }
    })

    return visits
  } catch (error) {
    console.error(`Error fetching visits for lead ${leadId}:`, error)
    throw new Error(`Failed to fetch visits: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get visits for a specific user
 */
export async function getVisitsByUserId(userId: string): Promise<Visit[]> {
  try {
    const visits = await prisma.visit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        lead: true,
        user: true,
      }
    })

    return visits
  } catch (error) {
    console.error(`Error fetching visits for user ${userId}:`, error)
    throw new Error(`Failed to fetch visits: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
} 