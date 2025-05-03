import { prisma } from './prisma'
import { KnockStatus, type Prisma } from '@prisma/client'

interface ContactInfo {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

interface Visit {
  id: string
  date: string
  salesPersonId: string
  salesPersonName: string
  salesPersonEmail: string
  status: KnockStatus
  notes: string
  followUpDate?: string | null
}

interface FollowUp {
  date?: string | null
  time?: string | null
  notes?: string | null
}

interface CreateVisionMarkerInput {
  latitude: number
  longitude: number
  address: string
  notes?: string | null
  status?: KnockStatus
  contactInfo?: ContactInfo
  followUp?: FollowUp
  visits?: Visit[]
  userId?: string | null
}

interface UpdateVisionMarkerInput extends Partial<CreateVisionMarkerInput> {}

type VisionMarker = Prisma.VisionMarkerGetPayload<{}>

/**
 * Get all vision markers
 */
export async function getMarkers(): Promise<VisionMarker[]> {
  try {
    const markers = await prisma.visionMarker.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return markers
  } catch (error) {
    console.error("Error fetching markers:", error)
    throw new Error(`Failed to fetch markers: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get a single vision marker by ID
 */
export async function getMarkerById(id: string): Promise<VisionMarker | null> {
  try {
    // Return null for temporary markers instead of trying to query the database
    if (id.startsWith('temp-')) {
      return null
    }

    const marker = await prisma.visionMarker.findUnique({
      where: { id }
    })
    return marker
  } catch (error) {
    console.error(`Error fetching marker ${id}:`, error)
    throw new Error(`Failed to fetch marker: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Search for vision markers by address
 */
export async function getMarkersByAddress(address: string): Promise<VisionMarker[]> {
  try {
    const markers = await prisma.visionMarker.findMany({
      where: {
        address: {
          contains: address,
          mode: 'insensitive'
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return markers
  } catch (error) {
    console.error(`Error searching markers by address ${address}:`, error)
    throw new Error(`Failed to search markers: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Create a new vision marker
 */
export async function createMarker(data: CreateVisionMarkerInput): Promise<VisionMarker> {
  try {
    const marker = await prisma.visionMarker.create({
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        notes: data.notes || null,
        status: data.status || KnockStatus.KNOCKED,
        contactInfo: data.contactInfo ? (data.contactInfo as Prisma.InputJsonValue) : undefined,
        followUp: data.followUp ? (data.followUp as Prisma.InputJsonValue) : undefined,
        visits: data.visits ? (data.visits as unknown as Prisma.InputJsonValue) : undefined,
        userId: data.userId
      }
    })

    console.log("Vision marker created successfully:", marker)
    return marker
  } catch (error) {
    console.error("Error creating vision marker:", error)
    throw new Error(`Failed to create marker: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Update an existing vision marker
 */
export async function updateMarker(id: string, data: UpdateVisionMarkerInput): Promise<VisionMarker> {
  try {
    const updateData: Prisma.VisionMarkerUpdateInput = {
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.contactInfo !== undefined && { contactInfo: data.contactInfo as Prisma.InputJsonValue }),
      ...(data.followUp !== undefined && { followUp: data.followUp as Prisma.InputJsonValue }),
      ...(data.visits !== undefined && { visits: data.visits as unknown as Prisma.InputJsonValue }),
      ...(data.userId !== undefined && { userId: data.userId })
    }

    const marker = await prisma.visionMarker.update({
      where: { id },
      data: updateData
    })

    console.log("Vision marker updated successfully:", marker)
    return marker
  } catch (error) {
    console.error(`Error updating vision marker ${id}:`, error)
    throw new Error(`Failed to update marker: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Delete a vision marker
 */
export async function deleteMarker(id: string): Promise<VisionMarker> {
  try {
    const marker = await prisma.visionMarker.delete({
      where: { id }
    })

    console.log("Vision marker deleted successfully:", marker)
    return marker
  } catch (error) {
    console.error(`Error deleting vision marker ${id}:`, error)
    throw new Error(`Failed to delete marker: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
} 