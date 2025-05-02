"use client"

import type { PeriodComparison } from "@/types/financial"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PeriodComparisonCardProps {
  data: PeriodComparison[]
}

export function PeriodComparisonCard({ data }: PeriodComparisonCardProps) {
  const formatValue = (metric: string, value: number) => {
    if (metric.toLowerCase().includes("rate") || metric.toLowerCase().includes("percentage")) {
      return `${value}%`
    } else if (metric.toLowerCase().includes("days")) {
      return `${value} days`
    } else if (metric.toLowerCase().includes("revenue") || metric.toLowerCase().includes("invoice")) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value)
    }
    return value
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Period Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.metric} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.metric}</p>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-1">Current:</span>
                  <span className="text-xs font-medium">{formatValue(item.metric, item.current)}</span>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground mr-2">vs. Previous</span>
                <div className={`flex items-center text-xs ${item.isPositive ? "text-green-500" : "text-red-500"}`}>
                  {item.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  <span>{item.changePercentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
