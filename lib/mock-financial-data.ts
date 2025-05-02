import type { FinancialHealthData } from "@/types/financial"

export const mockFinancialData: FinancialHealthData = {
  agingReceivables: [
    { period: "Current", amount: 42500, percentage: 45 },
    { period: "1-30 days", amount: 28700, percentage: 30 },
    { period: "31-60 days", amount: 14300, percentage: 15 },
    { period: "61-90 days", amount: 5700, percentage: 6 },
    { period: "90+ days", amount: 3800, percentage: 4 },
  ],
  cashFlow: [
    { month: "Jan", income: 68000, expenses: 52000, net: 16000 },
    { month: "Feb", income: 72000, expenses: 54000, net: 18000 },
    { month: "Mar", income: 75000, expenses: 58000, net: 17000 },
    { month: "Apr", income: 82000, expenses: 62000, net: 20000 },
    { month: "May", income: 88000, expenses: 65000, net: 23000 },
    { month: "Jun", income: 95000, expenses: 68000, net: 27000 },
  ],
  paymentVelocity: [
    { period: "Q1", averageDays: 32, changePercentage: 0 },
    { period: "Q2", averageDays: 28, changePercentage: -12.5 },
    { period: "Current", averageDays: 25, changePercentage: -10.7 },
  ],
  periodComparisons: [
    {
      metric: "Total Revenue",
      current: 285000,
      previous: 245000,
      changePercentage: 16.3,
      isPositive: true,
    },
    {
      metric: "Average Invoice",
      current: 4850,
      previous: 4200,
      changePercentage: 15.5,
      isPositive: true,
    },
    {
      metric: "Collection Rate",
      current: 92,
      previous: 87,
      changePercentage: 5.7,
      isPositive: true,
    },
    {
      metric: "Days to Payment",
      current: 25,
      previous: 32,
      changePercentage: -21.9,
      isPositive: true,
    },
  ],
  projectedVsActual: [
    { month: "Jan", projected: 65000, actual: 68000 },
    { month: "Feb", projected: 68000, actual: 72000 },
    { month: "Mar", projected: 72000, actual: 75000 },
    { month: "Apr", projected: 78000, actual: 82000 },
    { month: "May", projected: 85000, actual: 88000 },
    { month: "Jun", projected: 90000, actual: 95000 },
  ],
  totalOutstanding: 95000,
  collectionRate: 92,
  averageInvoiceAmount: 4850,
  averagePaymentTime: 25,
}
