import type { LeadStatus } from "@prisma/client"

export interface LeadSummary {
  id: string
  name: string
  address: string
  phone: string
  status: LeadStatus
  createdAt: string
  appointmentDate?: Date
  email: string
  assignedTo?: string
  assignedToId?: string
  claimNumber?: string | null
  insuranceCompany?: string | null
  latestActivity?: {
    title: string
    createdAt: string
    type: string
  } | null
}

export interface AppointmentSummary {
  id: string
  clientName: string
  address: string
  date: Date
  status: AppointmentStatus
  leadId: string
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "rescheduled"

export interface StatusCount {
  status: LeadStatus
  count: number
  color: string
  borderColor: string
  imageUrl: string
}
