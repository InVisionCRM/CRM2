import { prisma } from './prisma'
import { Lead, ActivityType, ActivityStatus, LeadStatus } from '@prisma/client'
import { nanoid } from "nanoid"
import crypto from "crypto"

export async function getLeads(): Promise<Lead[]> {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        activities: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            title: true,
            type: true,
            createdAt: true
          }
        }
      }
    })
    return leads
  } catch (error) {
    console.error("Error fetching leads:", error)
    throw new Error("Failed to fetch leads")
  }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  try {
    const leads = await prisma.lead.findMany({
      where: { id }
    })
    return leads.length > 0 ? leads[0] : null
  } catch (error) {
    console.error(`Error fetching lead with ID ${id}:`, error)
    throw new Error("Failed to fetch lead")
  }
}

export async function getNextClientId(): Promise<string> {
  try {
    const sequence = await prisma.clientIdSequence.upsert({
      where: { id: 1 },
      update: { lastId: { increment: 1 } },
      create: { id: 1, lastId: 10000 }
    })
    return sequence.lastId.toString()
  } catch (error) {
    console.error("Error getting next client ID:", error)
    throw new Error(`Failed to get next client ID: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

interface CreateLeadInput {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  address?: string | null
  status: LeadStatus
  assignedToId?: string | null
  notes?: string | null
  userId: string // Required for activity creation
}

export async function createLead(data: CreateLeadInput): Promise<Lead> {
  try {
    const id = crypto.randomUUID()

    const lead = await prisma.lead.create({
      data: {
        id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: data.status,
        assignedToId: data.assignedToId,
        notes: data.notes
      }
    })

    // Create activity for lead creation
    await prisma.activity.create({
      data: {
        id: crypto.randomUUID(),
        type: ActivityType.LEAD_CREATED,
        title: `New lead created: ${lead.firstName} ${lead.lastName}`,
        description: null,
        userId: data.userId,
        leadId: lead.id,
      }
    })

    return lead
  } catch (error) {
    console.error("Error creating lead:", error)
    throw new Error(`Failed to create lead: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export interface UpdateLeadInput {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  status?: LeadStatus
  assignedToId?: string | null
  notes?: string | null
  userId: string // Required for activity creation
}

export async function updateLead(
  id: string,
  data: UpdateLeadInput
): Promise<Lead | null> {
  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.status && { status: data.status }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    })

    // Create activity for status change
    if (data.status) {
      await prisma.activity.create({
        data: {
          id: crypto.randomUUID(),
          type: ActivityType.STATUS_CHANGED,
          title: `Lead status changed to ${data.status}`,
          description: null,
          userId: data.userId,
          leadId: id,
        }
      })
    }

    return lead
  } catch (error) {
    console.error(`Error updating lead with ID ${id}:`, error)
    throw new Error(`Failed to update lead: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    // Delete the lead (this will cascade delete related records due to our schema setup)
    const result = await prisma.lead.delete({
      where: { id }
    })

    return !!result
  } catch (error) {
    console.error(`Error deleting lead with ID ${id}:`, error)
    throw new Error(`Failed to delete lead: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
