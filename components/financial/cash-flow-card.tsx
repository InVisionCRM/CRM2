"use client"

import type { CashFlowData } from "@/types/financial"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface CashFlowCardProps {
  data: CashFlowData[]
}

export function CashFlowCard({ data }: CashFlowCardProps) {
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
        <CardTitle className="text-lg">Cash Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), ""]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-4">
          <div className="flex items-center">
            <div className="mr-1 h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center">
            <div className="mr-1 h-3 w-3 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
