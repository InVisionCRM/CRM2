import { Appointment, AppointmentPurpose, AppointmentStatus } from '@prisma/client'

export type { Appointment, AppointmentStatus }

export const AppointmentPurposeEnum = {
  INITIAL_CONSULTATION: AppointmentPurpose.INITIAL_CONSULTATION,
  ESTIMATE: AppointmentPurpose.ESTIMATE,
  FOLLOW_UP: AppointmentPurpose.FOLLOW_UP,
  INSPECTION: AppointmentPurpose.INSPECTION,
  CONTRACT_SIGNING: AppointmentPurpose.CONTRACT_SIGNING,
  OTHER: AppointmentPurpose.OTHER
} as const

export type { AppointmentPurpose }

export interface AppointmentWithRelations extends Appointment {
  lead: {
    id: string
    name: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

export interface AppointmentFormData {
  title: string
  startTime: string
  endTime: string
  purpose: AppointmentPurpose
  status?: AppointmentStatus
  leadId: string
  address?: string
  notes?: string
}

export interface CalendarAppointment {
  id: string
  title: string
  date?: Date
  startTime: string
  endTime: string
  status: string
  leadId: string
  leadName: string
  address?: string
  notes?: string
  type?: string
  purpose?: AppointmentPurpose
}

export interface AppointmentsByDate {
  [date: string]: CalendarAppointment[]
}

export const PURPOSE_LABELS: Record<AppointmentPurpose, string> = {
  INITIAL_CONSULTATION: "Initial Consultation",
  ESTIMATE: "Estimate",
  FOLLOW_UP: "Follow Up",
  INSPECTION: "Inspection",
  CONTRACT_SIGNING: "Contract Signing",
  OTHER: "Other"
}
