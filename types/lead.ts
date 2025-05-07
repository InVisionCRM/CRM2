import type { DamageType, AppointmentPurpose, AppointmentStatus, LeadStatus } from "@prisma/client"

export interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: LeadStatus
  notes: string | null
  assignedToId: string | null
  insuranceCompany: string | null
  insurancePolicyNumber: string | null
  insurancePhone: string | null
  insuranceAdjusterName: string | null
  insuranceAdjusterPhone: string | null
  insuranceAdjusterEmail: string | null
  insuranceDeductible: string | null
  insuranceSecondaryPhone: string | null
  dateOfLoss: string | null
  damageType: DamageType | null
  claimNumber: string | null
  adjusterAppointmentDate: string | null
  adjusterAppointmentTime: string | null
  adjusterAppointmentNotes: string | null
  googleEventId: string | null
  latitude: number | null
  longitude: number | null
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  content: string
  createdAt: Date
  createdBy: string
}

export interface Appointment {
  id: string
  date: Date
  purpose: AppointmentPurpose
  status: AppointmentStatus
  notes?: string
}

export interface File {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: Date
}

export interface LeadFilters {
  status?: LeadStatus[]
  assignedTo?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
}
