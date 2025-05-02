export interface AgingReceivable {
  period: string
  amount: number
  percentage: number
}

export interface CashFlowData {
  month: string
  income: number
  expenses: number
  net: number
}

export interface PaymentVelocity {
  period: string
  averageDays: number
  changePercentage: number
}

export interface PeriodComparison {
  metric: string
  current: number
  previous: number
  changePercentage: number
  isPositive: boolean
}

export interface ProjectedVsActual {
  month: string
  projected: number
  actual: number
}

export interface FinancialHealthData {
  agingReceivables: AgingReceivable[]
  cashFlow: CashFlowData[]
  paymentVelocity: PaymentVelocity[]
  periodComparisons: PeriodComparison[]
  projectedVsActual: ProjectedVsActual[]
  totalOutstanding: number
  collectionRate: number
  averageInvoiceAmount: number
  averagePaymentTime: number
}
