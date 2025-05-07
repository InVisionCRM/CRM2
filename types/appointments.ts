import { Appointment, AppointmentStatus, AppointmentPurpose } from '@prisma/client'

export type { Appointment, AppointmentStatus, AppointmentPurpose }

export const AppointmentPurposeEnum = {
  INSPECTION: "INSPECTION",
  FILE_CLAIM: "FILE_CLAIM",
  FOLLOW_UP: "FOLLOW_UP",
  ADJUSTER: "ADJUSTER",
  BUILD_DAY: "BUILD_DAY",
  OTHER: "OTHER"
} as const

export interface AppointmentWithRelations extends Appointment {
  lead: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
  user: {
    id: string
    name: string | null
  } | null
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
  INSPECTION: "Inspection",
  FILE_CLAIM: "File Claim",
  FOLLOW_UP: "Follow Up",
  ADJUSTER: "Adjuster Meeting",
  BUILD_DAY: "Build Day",
  OTHER: "Other"
}

export interface CreateAppointmentInput {
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

export interface UpdateAppointmentInput {
  title?: string
  startTime?: Date
  endTime?: Date
  purpose?: AppointmentPurpose
  status?: AppointmentStatus
  address?: string | null
  notes?: string | null
}
