import { prisma } from './prisma'
import { Lead, ActivityType, LeadStatus, UserRole } from '@prisma/client'
import { nanoid } from "nanoid"
import crypto from "crypto"
import type { SortField, SortOrder } from "@/app/leads/page"
import { createLeadSlackChannel } from "@/lib/services/leadSlackIntegration"

interface GetLeadsOptions {
  status?: LeadStatus | null
  assignedTo?: string | null
  search?: string
  sort?: SortField
  order?: SortOrder
  userId: string // Add userId as a required field
  lastInteractionBefore?: string // ISO date string for filtering inactive leads
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

    // Filter by last interaction date if provided
    if (options.lastInteractionBefore) {
      const date = new Date(options.lastInteractionBefore)
      where.updatedAt = {
        lt: date
      }
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        // Insurance fields
        insuranceCompany: true,
        insurancePolicyNumber: true,
        insurancePhone: true,
        insuranceSecondaryPhone: true,
        insuranceDeductible: true,
        dateOfLoss: true,
        damageType: true,
        claimNumber: true,
        // Adjuster fields
        insuranceAdjusterName: true,
        insuranceAdjusterPhone: true,
        insuranceAdjusterEmail: true,
        adjusterAppointmentDate: true,
        adjusterAppointmentTime: true,
        adjusterAppointmentNotes: true,
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

// Function to geocode address
async function geocodeAddress(address: string) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

export async function createLead(data: CreateLeadInput): Promise<Lead> {
  try {
    const id = crypto.randomUUID()

    // Get coordinates if address is provided
    let coordinates = null;
    if (data.address) {
      coordinates = await geocodeAddress(data.address);
    }

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
        // Add coordinates if available
        ...(coordinates && {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        }),
        // Insurance fields
        insuranceCompany: data.insuranceCompany,
        insurancePolicyNumber: data.insurancePolicyNumber,
        insurancePhone: data.insurancePhone,
        insuranceSecondaryPhone: data.insuranceSecondaryPhone,
        insuranceDeductible: data.insuranceDeductible,
        dateOfLoss: data.dateOfLoss,
        damageType: data.damageType as any,
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

    // Create Slack channel for the new lead
    console.log('🔍 [CREATE LEAD] Attempting to create Slack channel for lead:', lead.id)
    try {
      // Get user information for Slack integration
      const creator = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, name: true, email: true }
      })

      const assignedUser = data.assignedToId ? await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { id: true, name: true, email: true }
      }) : null

      if (creator) {
        console.log('🔍 [CREATE LEAD] Creator found:', creator.email)
        console.log('🔍 [CREATE LEAD] Assigned user:', assignedUser?.email || 'None')

        const result = await createLeadSlackChannel({
          leadId: lead.id,
          leadName: `${lead.firstName} ${lead.lastName}`.trim(),
          leadEmail: lead.email || undefined,
          leadAddress: lead.address || undefined,
          leadStatus: lead.status,
          leadClaimNumber: lead.claimNumber || undefined,
          createdBy: {
            id: creator.id,
            name: creator.name || 'Unknown User',
            email: creator.email || ''
          },
          assignedTo: assignedUser ? {
            id: assignedUser.id,
            name: assignedUser.name || 'Unknown User',
            email: assignedUser.email || ''
          } : undefined
        })

        console.log('🔍 [CREATE LEAD] Slack channel creation result:', result)

        if (result.success) {
          console.log(`✅ [CREATE LEAD] Slack channel created for lead ${lead.id}`)
        } else {
          console.error(`❌ [CREATE LEAD] Slack channel creation failed: ${result.error}`)
        }
      } else {
        console.error('❌ [CREATE LEAD] Creator user not found:', data.userId)
      }
    } catch (slackError) {
      console.error(`❌ [CREATE LEAD] Error creating Slack channel:`, slackError)
      // Don't fail lead creation if Slack fails
    }

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

export async function deleteLead(id: string, userId: string): Promise<{ success: boolean; error?: string; deletedLead?: any }> {
  try {
    // Get the lead to check ownership and user role, including more details for notification
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { 
        assignedToId: true,
        firstName: true,
        lastName: true,
        email: true,
        address: true,
        status: true,
        createdAt: true
      }
    })

    if (!lead) {
      return { success: false, error: "Lead not found" }
    }

    // Get user role to check authorization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check authorization: admins can delete any lead, users can only delete their assigned leads
    if (user.role !== 'ADMIN' && lead.assignedToId !== userId) {
      return { success: false, error: "Unauthorized to delete this lead" }
    }

    // Delete all related records first
    await prisma.activity.deleteMany({
      where: { leadId: id }
    })

    await prisma.file.deleteMany({
      where: { leadId: id }
    })

    await prisma.appointment.deleteMany({
      where: { leadId: id }
    })

    await prisma.contract.deleteMany({
      where: { leadId: id }
    })

    await prisma.leadPhoto.deleteMany({
      where: { leadId: id }
    })

    await prisma.visit.deleteMany({
      where: { leadId: id }
    })

    await prisma.job_costs.deleteMany({
      where: { leadId: id }
    })

    await prisma.payments.deleteMany({
      where: { leadId: id }
    })

    await prisma.supplements.deleteMany({
      where: { leadId: id }
    })

    // Delete vision marker if exists
    await prisma.visionMarker.deleteMany({
      where: { leadId: id }
    })

    // Delete the lead
    await prisma.lead.delete({
      where: { id }
    })

    // Return success with deleted lead data for notification
    return { 
      success: true,
      deletedLead: {
        ...lead,
        deletedBy: {
          id: userId,
          name: user.name,
          email: user.email
        }
      }
    }
  } catch (error) {
    console.error(`Error deleting lead with ID ${id}:`, error)
    return { success: false, error: "Failed to delete lead" }
  }
}