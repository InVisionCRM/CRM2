import type { Lead } from "@/types/lead"

// Mock data for demonstration
const mockLeads: Lead[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St",
    city: "Anytown",
    state: "CA",
    zip: "12345",
    status: "signed_contract",
    source: "Website Inquiry",
    createdAt: new Date(2023, 6, 25),
    updatedAt: new Date(2023, 6, 25),
    notes: [
      {
        id: "n1",
        content: "Customer called about hail damage to their roof.",
        createdAt: new Date(2023, 6, 25),
        createdBy: "Mike Johnson",
      },
      {
        id: "n2",
        content: "Scheduled initial assessment for next week.",
        createdAt: new Date(2023, 6, 26),
        createdBy: "Mike Johnson",
      },
    ],
    appointments: [
      {
        id: "a1",
        date: new Date(2023, 7, 2, 10, 30),
        purpose: "initial_assessment",
        status: "scheduled",
      },
    ],
    files: [],
    propertyDetails: {
      roofType: "Asphalt Shingle",
      roofAge: 15,
      squareFootage: 2200,
      stories: 2,
      hasExistingDamage: true,
      damageType: "Hail",
      insuranceClaim: true,
      insuranceCompany: "State Farm",
      claimNumber: "SF-12345",
    },
    assignedTo: "user1",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "(555) 987-6543",
    address: "456 Oak Ave",
    city: "Somewhere",
    state: "TX",
    zip: "67890",
    status: "scheduled",
    source: "Referral",
    createdAt: new Date(2023, 6, 24),
    updatedAt: new Date(2023, 6, 27),
    notes: [
      {
        id: "n3",
        content: "Referred by John Smith. Interested in a full roof replacement.",
        createdAt: new Date(2023, 6, 24),
        createdBy: "Lisa Brown",
      },
    ],
    appointments: [
      {
        id: "a2",
        date: new Date(2023, 7, 5, 14, 0),
        purpose: "measurement",
        status: "scheduled",
      },
    ],
    files: [
      {
        id: "f1",
        name: "Initial Assessment Photos",
        url: "/placeholder.svg",
        type: "image/jpeg",
        size: 2500000,
        uploadedAt: new Date(2023, 6, 26),
      },
    ],
    propertyDetails: {
      roofType: "Metal",
      roofAge: 20,
      squareFootage: 1800,
      stories: 1,
      hasExistingDamage: true,
      damageType: "Wind",
      insuranceClaim: false,
      insuranceCompany: undefined,
      claimNumber: undefined,
    },
    assignedTo: "user2",
  },
]

export function getMockLeadById(id: string): Lead | undefined {
  return mockLeads.find((lead) => lead.id === id)
}

export function getMockLeads(): Lead[] {
  return mockLeads
}
