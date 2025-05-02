"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Clock, PercentSquare, CreditCard } from "lucide-react"

interface SummaryMetricsCardProps {
  totalOutstanding: number
  collectionRate: number
  averageInvoiceAmount: number
  averagePaymentTime: number
}

export function SummaryMetricsCard({
  totalOutstanding,
  collectionRate,
  averageInvoiceAmount,
  averagePaymentTime,
}: SummaryMetricsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const metrics = [
    {
      label: "Total Outstanding",
      value: formatCurrency(totalOutstanding),
      icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
    },
    {
      label: "Collection Rate",
      value: `${collectionRate}%`,
      icon: <PercentSquare className="h-5 w-5 text-blue-500" />,
    },
    {
      label: "Average Invoice",
      value: formatCurrency(averageInvoiceAmount),
      icon: <CreditCard className="h-5 w-5 text-purple-500" />,
    },
    {
      label: "Avg. Payment Time",
      value: `${averagePaymentTime} days`,
      icon: <Clock className="h-5 w-5 text-amber-500" />,
    },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col items-center text-center">
              <div className="mb-2">{metric.icon}</div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
