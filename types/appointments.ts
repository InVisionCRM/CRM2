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
  id?: string
  title: string
  date: Date | undefined
  startTime: string
  endTime: string
  status?: AppointmentStatus | string
  leadId?: string
  leadName?: string
  address?: string | undefined
  notes?: string | undefined
  purpose?: AppointmentPurpose | string
  userId?: string
  recurrenceRule?: string
  isRecurring?: boolean
}

export type CalendarEvent = CalendarAppointment

export interface RawGCalEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  colorId?: string;
  recurringEventId?: string;
  originalStartTime?: { date?: string; dateTime?: string; timeZone?: string };
  extendedProperties?: {
    private?: Record<string, any>;
    shared?: Record<string, any>;
  };
  attendees?: Array<{
    id?: string;
    email?: string;
    displayName?: string;
    organizer?: boolean;
    self?: boolean;
    resource?: boolean;
    optional?: boolean;
    responseStatus?: string;
    comment?: string;
    additionalGuests?: number;
  }>;
  organizer?: {
    id?: string;
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  creator?: {
    id?: string;
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  recurrence?: string[];
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
