import type { TeamPerformance } from "@/types/performance"

export const mockPerformanceData: TeamPerformance = {
  totalRevenue: 1250000,
  averageSaleValue: 12500,
  totalDoorsKnocked: {
    daily: 120,
    weekly: 750,
    monthly: 3200,
  },
  totalConversions: {
    daily: 8,
    weekly: 45,
    monthly: 180,
  },
  totalRoofsInspected: {
    daily: 12,
    weekly: 65,
    monthly: 260,
  },
  totalContractsSigned: {
    daily: 5,
    weekly: 28,
    monthly: 100,
  },
  teamMembers: [
    {
      id: "1",
      userId: "user1",
      userName: "John Smith",
      userAvatar: "/placeholder.svg?height=40&width=40",
      averageSaleRevenue: 13200,
      totalSaleRevenue: 330000,
      doorsKnocked: {
        daily: 35,
        weekly: 210,
        monthly: 850,
      },
      conversion: {
        daily: 3,
        weekly: 15,
        monthly: 55,
      },
      roofsInspected: {
        daily: 4,
        weekly: 20,
        monthly: 75,
      },
      contractsSigned: {
        daily: 2,
        weekly: 10,
        monthly: 25,
      },
    },
    {
      id: "2",
      userId: "user2",
      userName: "Sarah Johnson",
      userAvatar: "/placeholder.svg?height=40&width=40",
      averageSaleRevenue: 14500,
      totalSaleRevenue: 420000,
      doorsKnocked: {
        daily: 30,
        weekly: 180,
        monthly: 750,
      },
      conversion: {
        daily: 2,
        weekly: 12,
        monthly: 48,
      },
      roofsInspected: {
        daily: 3,
        weekly: 18,
        monthly: 65,
      },
      contractsSigned: {
        daily: 1,
        weekly: 8,
        monthly: 29,
      },
    },
    {
      id: "3",
      userId: "user3",
      userName: "Mike Davis",
      userAvatar: "/placeholder.svg?height=40&width=40",
      averageSaleRevenue: 11800,
      totalSaleRevenue: 295000,
      doorsKnocked: {
        daily: 28,
        weekly: 170,
        monthly: 720,
      },
      conversion: {
        daily: 2,
        weekly: 10,
        monthly: 42,
      },
      roofsInspected: {
        daily: 3,
        weekly: 15,
        monthly: 60,
      },
      contractsSigned: {
        daily: 1,
        weekly: 6,
        monthly: 25,
      },
    },
    {
      id: "4",
      userId: "user4",
      userName: "Emily Wilson",
      userAvatar: "/placeholder.svg?height=40&width=40",
      averageSaleRevenue: 12200,
      totalSaleRevenue: 205000,
      doorsKnocked: {
        daily: 27,
        weekly: 190,
        monthly: 880,
      },
      conversion: {
        daily: 1,
        weekly: 8,
        monthly: 35,
      },
      roofsInspected: {
        daily: 2,
        weekly: 12,
        monthly: 60,
      },
      contractsSigned: {
        daily: 1,
        weekly: 4,
        monthly: 21,
      },
    },
  ],
}
