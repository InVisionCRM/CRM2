"use client"

import type { ProjectedVsActual } from "@/types/financial"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface ProjectedVsActualCardProps {
  data: ProjectedVsActual[]
}

export function ProjectedVsActualCard({ data }: ProjectedVsActualCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Projected vs. Actual Collections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), ""]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="projected"
                name="Projected"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-4">
          <div className="flex items-center">
            <div className="mr-1 h-3 w-3 rounded-full bg-indigo-500" />
            <span className="text-xs text-muted-foreground">Projected</span>
          </div>
          <div className="flex items-center">
            <div className="mr-1 h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Actual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
