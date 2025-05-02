import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockFinancialData } from "@/lib/mock-financial-data"
import { CashFlowCard } from "@/components/financial/cash-flow-card"
import { PeriodComparisonCard } from "@/components/financial/period-comparison-card"
import { ProjectedVsActualCard } from "@/components/financial/projected-vs-actual-card"
import { SummaryMetricsCard } from "@/components/financial/summary-metrics-card"

export const metadata: Metadata = {
  title: "Financial Health Overview | Roofing CRM",
  description: "Comprehensive view of your company's financial health and metrics",
}

export default function FinancialHealthPage() {
  return (
    <div className="container px-4 py-4 mx-auto max-w-7xl">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Dashboard</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Financial Health Overview</h1>
      </div>

      <div className="mb-6">
        <SummaryMetricsCard
          totalOutstanding={mockFinancialData.totalOutstanding}
          collectionRate={mockFinancialData.collectionRate}
          averageInvoiceAmount={mockFinancialData.averageInvoiceAmount}
          averagePaymentTime={mockFinancialData.averagePaymentTime}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <CashFlowCard data={mockFinancialData.cashFlow} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PeriodComparisonCard data={mockFinancialData.periodComparisons} />
        <ProjectedVsActualCard data={mockFinancialData.projectedVsActual} />
      </div>
    </div>
  )
}
