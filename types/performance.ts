export interface SalesMetric {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  averageSaleRevenue: number
  totalSaleRevenue: number
  doorsKnocked: {
    daily: number
    weekly: number
    monthly: number
  }
  conversion: {
    daily: number
    weekly: number
    monthly: number
  }
  roofsInspected: {
    daily: number
    weekly: number
    monthly: number
  }
  contractsSigned: {
    daily: number
    weekly: number
    monthly: number
  }
}

export interface TeamPerformance {
  totalRevenue: number
  averageSaleValue: number
  totalDoorsKnocked: {
    daily: number
    weekly: number
    monthly: number
  }
  totalConversions: {
    daily: number
    weekly: number
    monthly: number
  }
  totalRoofsInspected: {
    daily: number
    weekly: number
    monthly: number
  }
  totalContractsSigned: {
    daily: number
    weekly: number
    monthly: number
  }
  teamMembers: SalesMetric[]
}

export type TimeFrame = "daily" | "weekly" | "monthly" | "all"
export type MetricType = "revenue" | "doorsKnocked" | "conversion" | "roofsInspected" | "contractsSigned"
