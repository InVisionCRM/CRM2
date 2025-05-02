"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import type { TeamPerformance, TimeFrame } from "@/types/performance"

interface PerformanceSummaryCardProps {
  data: TeamPerformance
}

export function PerformanceSummaryCard({ data }: PerformanceSummaryCardProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTimeFrameData = (metric: keyof typeof data.totalDoorsKnocked) => {
    return data[`total${metric.charAt(0).toUpperCase() + metric.slice(1)}` as keyof TeamPerformance][
      timeFrame as keyof typeof data.totalDoorsKnocked
    ]
  }

  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      icon: "💰",
    },
    {
      title: "Avg. Sale Value",
      value: formatCurrency(data.averageSaleValue),
      icon: "📈",
    },
    {
      title: "Doors Knocked",
      value: getTimeFrameData("doorsKnocked"),
      icon: "🚪",
    },
    {
      title: "Conversions",
      value: getTimeFrameData("conversions"),
      icon: "✅",
    },
    {
      title: "Roofs Inspected",
      value: getTimeFrameData("roofsInspected"),
      icon: "🔍",
    },
    {
      title: "Contracts Signed",
      value: getTimeFrameData("contractsSigned"),
      icon: "📝",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Team Performance Summary</CardTitle>
        <Tabs value={timeFrame} onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
          <TabsList className="grid grid-cols-3 h-8">
            <TabsTrigger value="daily" className="text-xs">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">
              Monthly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div key={metric.title} className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl mb-1">{metric.icon}</div>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="text-lg font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
