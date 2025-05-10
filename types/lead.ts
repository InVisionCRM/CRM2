import type { Lead as PrismaLead, LeadStatus, DamageType, AppointmentPurpose, AppointmentStatus } from "@prisma/client"
import { PhotoStage } from "@/types/photo"; // Ensure this path is correct

// Export Prisma's Lead type, possibly extended with client-side-only fields if necessary in the future.
// For now, we'll use it directly and ensure components adapt to its true shape.
export type Lead = PrismaLead

// Type for Lead when its `assignedTo` relation (User) is included
export type LeadWithAssignedUser = PrismaLead & {
  assignedTo?: import("@prisma/client").User | null; // Or import User directly if already available
};

// Re-export enums that might be used by components importing from this file.
export type { LeadStatus, DamageType, AppointmentPurpose, AppointmentStatus }

// Represents details specific to a property, potentially linked to a Lead
export interface PropertyDetails {
  id?: string; // Optional if it's part of a Lead or fetched by leadId
  leadId?: string;
  roofType?: string | null;
  roofAge?: number | null;
  squareFootage?: number | null;
  stories?: number | null;
  hasExistingDamage?: boolean | null;
  damageType?: string | null;      // This might overlap with Lead.damageType, consider consolidating
  insuranceClaim?: boolean | null;
  insuranceCompany?: string | null; // This might overlap with Lead.insuranceCompany, consider consolidating
  claimNumber?: string | null;      // This might overlap with Lead.claimNumber, consider consolidating
  // Add other fields as discovered or needed
}

export interface NoteImage { // Define NoteImage if it's part of the Note structure
  url: string;
  name: string;
  stage: PhotoStage;
  // Add any other relevant fields for an image associated with a note
}

export interface Note {
  id: string;
  leadId?: string;       // Add leadId, make optional if it can be absent
  content: string;
  createdAt: Date;        // Already Date
  updatedAt?: Date;       // Add optional updatedAt
  createdBy: string;
  images?: NoteImage[];   // Add optional images
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
