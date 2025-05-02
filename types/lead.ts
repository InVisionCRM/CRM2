export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost"

export type LeadSource = "website" | "referral" | "google" | "facebook" | "door_knocking" | "other"

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  status: string
  source: LeadSource
  createdAt: string
  updatedAt: string
  assignedTo: string | null
  latitude?: number
  longitude?: number
  roofSquareFootage?: number
  roofAge?: number
  roofType?: string
  insuranceCompany: string | null
  insurancePolicyNumber: string | null
  insurancePhone: string | null
  insuranceSecondaryPhone: string | null
  insuranceAdjusterName: string | null
  insuranceAdjusterPhone: string | null
  insuranceAdjusterEmail: string | null
  insuranceDeductible: number | null
  damageDate?: string
  damageType?: string
  contractSigned?: boolean
  contractSignedDate?: string
  proposalAmount?: number
  notes: string | null
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

export interface PropertyDetails {
  roofType: string
  roofAge?: number
  squareFootage?: number
  stories: number
  hasExistingDamage: boolean
  damageType?: string
  insuranceClaim: boolean
  insuranceCompany?: string
  claimNumber?: string
}

export type AppointmentPurpose =
  | "initial_assessment"
  | "measurement"
  | "proposal_presentation"
  | "contract_signing"
  | "installation"
  | "inspection"
  | "follow_up"

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "rescheduled"

export interface LeadFilters {
  status?: LeadStatus[]
  source?: LeadSource[]
  assignedTo?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
}
