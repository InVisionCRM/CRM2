"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { SalesMetric, TimeFrame } from "@/types/performance"

interface PerformanceMetricsCardProps {
  teamMembers: SalesMetric[]
}

export function PerformanceMetricsCard({ teamMembers }: PerformanceMetricsCardProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getChartData = () => {
    return teamMembers.map((member) => ({
      name: member.userName,
      doorsKnocked: member.doorsKnocked[timeFrame as keyof typeof member.doorsKnocked],
      conversions: member.conversion[timeFrame as keyof typeof member.conversion],
      roofsInspected: member.roofsInspected[timeFrame as keyof typeof member.roofsInspected],
      contractsSigned: member.contractsSigned[timeFrame as keyof typeof member.contractsSigned],
    }))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Performance Metrics</CardTitle>
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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()} barGap={4} barSize={16}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  return [value, name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())]
                }}
              />
              <Bar dataKey="doorsKnocked" name="Doors Knocked" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conversions" name="Conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="roofsInspected" name="Roofs Inspected" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contractsSigned" name="Contracts Signed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className="text-xs">Doors Knocked</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1"></div>
            <span className="text-xs">Conversions</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
            <span className="text-xs">Roofs Inspected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
            <span className="text-xs">Contracts Signed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
