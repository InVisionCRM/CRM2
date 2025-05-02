import { prisma } from './prisma'
import { Appointment, AppointmentStatus, Prisma } from '@prisma/client'
import type { AppointmentPurpose } from '@/types/appointments'

interface CreateAppointmentInput {
  title: string
  startTime: Date
  endTime: Date
  purpose: AppointmentPurpose
  status?: AppointmentStatus
  address?: string | null
  notes?: string | null
  leadId: string
  userId: string
}

interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {}

interface GetAppointmentsOptions {
  startDate?: Date
  endDate?: Date
  leadId?: string
  userId?: string
}

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentInput): Promise<Appointment> {
  try {
    const appointment = await prisma.appointment.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        purpose: data.purpose,
        status: data.status || 'SCHEDULED',
        address: data.address || null,
        notes: data.notes || null,
        leadId: data.leadId,
        userId: data.userId,
      },
      include: {
        lead: true,
        user: true,
      }
    })

    console.log("Appointment created successfully:", appointment)
    return appointment
  } catch (error) {
    console.error("Error creating appointment:", error)
    throw new Error(`Failed to create appointment: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get appointments with optional filters
 */
export async function getAppointments(options?: GetAppointmentsOptions): Promise<Appointment[]> {
  try {
    const where: Prisma.AppointmentWhereInput = {}

    if (options?.startDate) {
      where.startTime = {
        gte: options.startDate
      }
    }

    if (options?.endDate) {
      where.endTime = {
        lte: options.endDate
      }
    }

    if (options?.leadId) {
      where.leadId = options.leadId
    }

    if (options?.userId) {
      where.userId = options.userId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        lead: true,
        user: true,
      }
    })

    return appointments
  } catch (error) {
    console.error("Error fetching appointments:", error)
    throw new Error(`Failed to fetch appointments: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get a single appointment by ID
 */
export async function getAppointmentById(id: string): Promise<Appointment | null> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        lead: true,
        user: true,
      }
    })

    return appointment
  } catch (error) {
    console.error(`Error fetching appointment ${id}:`, error)
    throw new Error(`Failed to fetch appointment: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(id: string, data: UpdateAppointmentInput): Promise<Appointment> {
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.purpose !== undefined && { purpose: data.purpose }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.leadId !== undefined && { leadId: data.leadId }),
        ...(data.userId !== undefined && { userId: data.userId }),
      },
      include: {
        lead: true,
        user: true,
      }
    })

    console.log("Appointment updated successfully:", appointment)
    return appointment
  } catch (error) {
    console.error(`Error updating appointment ${id}:`, error)
    throw new Error(`Failed to update appointment: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Delete an appointment
 */
export async function deleteAppointment(id: string): Promise<Appointment> {
  try {
    const appointment = await prisma.appointment.delete({
      where: { id },
      include: {
        lead: true,
        user: true,
      }
    })

    console.log("Appointment deleted successfully:", appointment)
    return appointment
  } catch (error) {
    console.error(`Error deleting appointment ${id}:`, error)
    throw new Error(`Failed to delete appointment: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get appointments for a specific lead
 */
export async function getAppointmentsByLeadId(leadId: string): Promise<Appointment[]> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { leadId },
      orderBy: { startTime: 'asc' },
      include: {
        lead: true,
        user: true,
      }
    })

    return appointments
  } catch (error) {
    console.error(`Error fetching appointments for lead ${leadId}:`, error)
    throw new Error(`Failed to fetch appointments: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get appointments for a specific user
 */
export async function getAppointmentsByUserId(userId: string): Promise<Appointment[]> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' },
      include: {
        lead: true,
        user: true,
      }
    })

    return appointments
  } catch (error) {
    console.error(`Error fetching appointments for user ${userId}:`, error)
    throw new Error(`Failed to fetch appointments: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
} 