"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import type { TeamPerformance, TimeFrame } from "@/types/performance"

interface PerformanceSummaryCardProps {
  data: TeamPerformance
}

// Define a type for the keys of TeamPerformance that hold time-framed data
type TimeFramedMetricKey = Extract<keyof TeamPerformance, 
  | "totalDoorsKnocked"
  | "totalConversions"
  | "totalRoofsInspected"
  | "totalContractsSigned"
>;

export function PerformanceSummaryCard({ data }: PerformanceSummaryCardProps) {
  const [timeFrame, setTimeFrame] = useState<"daily" | "weekly" | "monthly">("daily")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTimeFrameData = (metricKey: TimeFramedMetricKey): number => {
    const metricObject = data[metricKey]; // Type is { daily: number; weekly: number; monthly: number; }
    // timeFrame is "daily" | "weekly" | "monthly", which are keys of metricObject
    return metricObject[timeFrame]; 
  };

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
      value: getTimeFrameData("totalDoorsKnocked"), // Use the new function with correct key
      icon: "🚪",
    },
    {
      title: "Conversions",
      value: getTimeFrameData("totalConversions"), // Use the new function with correct key
      icon: "✅",
    },
    {
      title: "Roofs Inspected",
      value: getTimeFrameData("totalRoofsInspected"), // Use the new function with correct key
      icon: "🔍",
    },
    {
      title: "Contracts Signed",
      value: getTimeFrameData("totalContractsSigned"), // Use the new function with correct key
      icon: "📝",
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Team Performance Summary</CardTitle>
        <Tabs value={timeFrame} onValueChange={(value) => setTimeFrame(value as "daily" | "weekly" | "monthly")}>
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
