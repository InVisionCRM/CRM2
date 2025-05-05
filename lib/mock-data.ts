import type { Lead } from "@/types/lead"

// Mock data for demonstration
export const mockLeads: Lead[] = [
  {
    id: "lead-001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    phone: "555-111-1111",
    address: "123 Oak St, Anytown USA",
    status: "follow_ups", 
    assignedToId: "user-123",
    createdAt: new Date(2023, 6, 25).toISOString(),
    updatedAt: new Date(2023, 6, 25).toISOString(),
    notes: "Initial inquiry about hail damage.",
    insuranceCompany: null,
    insurancePolicyNumber: null,
    insurancePhone: null,
    insuranceAdjusterName: null,
    insuranceAdjusterPhone: null,
    insuranceAdjusterEmail: null,
    insuranceDeductible: null,
    insuranceSecondaryPhone: null,
    dateOfLoss: null,
    damageType: null,
    claimNumber: null,
    adjusterAppointmentDate: null,
    adjusterAppointmentTime: null,
    adjusterAppointmentNotes: null,
    googleEventId: null,
    latitude: null,
    longitude: null,
  },
  {
    id: "lead-002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@email.com",
    phone: "555-222-2222",
    address: "456 Pine St, Anytown USA",
    status: "scheduled",
    assignedToId: "user-456",
    createdAt: new Date(2023, 6, 24).toISOString(),
    updatedAt: new Date(2023, 6, 27).toISOString(),
    notes: "Scheduled roof inspection.",
    insuranceCompany: "AllState",
    insurancePolicyNumber: "AS12345",
    insurancePhone: "555-INS-RANC",
    insuranceAdjusterName: null,
    insuranceAdjusterPhone: null,
    insuranceAdjusterEmail: null,
    insuranceDeductible: "1000",
    insuranceSecondaryPhone: null,
    dateOfLoss: new Date(2023, 5, 15).toISOString(),
    damageType: "HAIL",
    claimNumber: "CLM9876",
    adjusterAppointmentDate: null,
    adjusterAppointmentTime: null,
    adjusterAppointmentNotes: null,
    googleEventId: null,
    latitude: 35.123,
    longitude: -80.456,
  },
]

export function getMockLeadById(id: string): Lead | undefined {
  return mockLeads.find((lead) => lead.id === id)
}

export function getMockLeads(): Lead[] {
  return mockLeads
}

export const mockAppointments = [
  {
    id: "a1",
    date: new Date(2023, 7, 2, 10, 30),
    purpose: "INSPECTION",
    status: "SCHEDULED",
    notes: "Initial consultation to assess roof damage.",
    leadId: "lead-001",
    userId: "user-123",
    title: "Initial Assessment",
    startTime: "10:30",
    endTime: "11:30",
    address: "123 Oak St, Anytown USA",
  },
  {
    id: "a2",
    date: new Date(2023, 7, 5, 14, 0),
    purpose: "OTHER",
    status: "SCHEDULED",
    notes: "Measure roof for material estimate.",
    leadId: "lead-002",
    userId: "user-456",
    title: "Roof Measurement",
    startTime: "14:00",
    endTime: "15:00",
    address: "456 Pine St, Anytown USA",
  },
]
