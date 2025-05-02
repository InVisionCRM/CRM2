"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { Medal } from "lucide-react"
import type { SalesMetric, TimeFrame, MetricType } from "@/types/performance"

interface SalesLeaderboardProps {
  teamMembers: SalesMetric[]
}

export function SalesLeaderboard({ teamMembers }: SalesLeaderboardProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("daily")
  const [metricType, setMetricType] = useState<MetricType>("revenue")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getSortedMembers = () => {
    return [...teamMembers].sort((a, b) => {
      if (metricType === "revenue") {
        return b.totalSaleRevenue - a.totalSaleRevenue
      } else {
        return (
          b[metricType][timeFrame as keyof typeof b.doorsKnocked] -
          a[metricType][timeFrame as keyof typeof a.doorsKnocked]
        )
      }
    })
  }

  const getMetricValue = (member: SalesMetric) => {
    if (metricType === "revenue") {
      return formatCurrency(member.totalSaleRevenue)
    } else {
      return member[metricType][timeFrame as keyof typeof member.doorsKnocked]
    }
  }

  const getMetricLabel = () => {
    switch (metricType) {
      case "revenue":
        return "Total Revenue"
      case "doorsKnocked":
        return "Doors Knocked"
      case "conversion":
        return "Conversions"
      case "roofsInspected":
        return "Roofs Inspected"
      case "contractsSigned":
        return "Contracts Signed"
      default:
        return "Value"
    }
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500"
      case 1:
        return "text-gray-400"
      case 2:
        return "text-amber-700"
      default:
        return "text-transparent"
    }
  }

  const sortedMembers = getSortedMembers()

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="text-lg">Sales Leaderboard</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={metricType} onValueChange={(value) => setMetricType(value as MetricType)}>
              <SelectTrigger className="w-full sm:w-[180px] h-8">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="doorsKnocked">Doors Knocked</SelectItem>
                <SelectItem value="conversion">Conversions</SelectItem>
                <SelectItem value="roofsInspected">Roofs Inspected</SelectItem>
                <SelectItem value="contractsSigned">Contracts Signed</SelectItem>
              </SelectContent>
            </Select>

            {metricType !== "revenue" && (
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
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedMembers.map((member, index) => (
            <div key={member.id} className="flex items-center p-3 bg-muted/30 rounded-lg">
              <div className="relative mr-3">
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  <Image
                    src={member.userAvatar || "/placeholder.svg"}
                    alt={member.userName}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                {index < 3 && <Medal className={`absolute -top-1 -right-1 h-4 w-4 ${getMedalColor(index)}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{member.userName}</p>
                <p className="text-xs text-muted-foreground">
                  {metricType === "revenue" ? `Avg. Sale: ${formatCurrency(member.averageSaleRevenue)}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{getMetricValue(member)}</p>
                <p className="text-xs text-muted-foreground">{getMetricLabel()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
