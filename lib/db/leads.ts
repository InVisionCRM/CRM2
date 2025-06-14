import { prisma } from './prisma'
import { Lead, ActivityType, LeadStatus, UserRole } from '@prisma/client'
import { nanoid } from "nanoid"
import crypto from "crypto"
import type { SortField, SortOrder } from "@/app/leads/page"

interface GetLeadsOptions {
  status?: LeadStatus | null
  assignedTo?: string | null
  search?: string
  sort?: SortField
  order?: SortOrder
  userId: string // Add userId as a required field
}

export async function getLeads(options: GetLeadsOptions): Promise<Lead[]> {
  try {
    console.log('getLeads called with userId:', options.userId, 'type:', typeof options.userId);
    
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      select: { role: true },
    });

    console.log('User found:', !!user, 'for ID:', options.userId);

    if (!user) {
      //Try to find user by different ID format or return empty array for now
      console.error("User not found with ID:", options.userId);
      return []; // Return empty array instead of throwing error
    }

    // Build where clause
    const where: any = {}
    
    if (options.status) {
      where.status = options.status
    }
    
    // If user is not an admin, only show their assigned leads
    if (user.role !== UserRole.ADMIN) {
      where.assignedToId = options.userId
    } else if (options.assignedTo) {
      // If admin and assignedTo filter is provided, use it
      where.assignedToId = options.assignedTo
    }
    
    if (options.search) {
      where.OR = [
        { firstName: { contains: options.search, mode: 'insensitive' } },
        { lastName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search, mode: 'insensitive' } },
        { address: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy
    const orderBy: any = {}
    if (options.sort) {
      switch (options.sort) {
        case 'name':
          orderBy.firstName = options.order || 'asc'
          break
        case 'status':
          orderBy.status = options.order || 'asc'
          break
        case 'createdAt':
          orderBy.createdAt = options.order || 'desc'
          break
        default:
          orderBy.createdAt = 'desc'
      }
    } else {
      orderBy.createdAt = 'desc'
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy,
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
  // Insurance fields
  insuranceCompany?: string | null
  insurancePolicyNumber?: string | null
  insurancePhone?: string | null
  insuranceSecondaryPhone?: string | null
  insuranceDeductible?: string | null
  dateOfLoss?: Date | null
  damageType?: string | null
  claimNumber?: string | null
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
        notes: data.notes,
        // Insurance fields
        insuranceCompany: data.insuranceCompany,
        insurancePolicyNumber: data.insurancePolicyNumber,
        insurancePhone: data.insurancePhone,
        insuranceSecondaryPhone: data.insuranceSecondaryPhone,
        insuranceDeductible: data.insuranceDeductible,
        dateOfLoss: data.dateOfLoss,
        damageType: data.damageType as any, // Cast to handle enum
        claimNumber: data.claimNumber
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
    return null
  }
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    // Delete all related activities first
    await prisma.activity.deleteMany({
      where: { leadId: id }
    })

    // Delete all related files
    await prisma.file.deleteMany({
      where: { leadId: id }
    })

    // Delete the lead
    await prisma.lead.delete({
      where: { id }
    })

    return true
  } catch (error) {
    console.error(`Error deleting lead with ID ${id}:`, error)
    return false
  }
}