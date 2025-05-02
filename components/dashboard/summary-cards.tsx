"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"

import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AppointmentsDrawer } from "@/components/appointments/appointments-drawer"

interface SummaryCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  colorClass?: string
  onClick?: () => void
}

function SummaryCard({ title, value, description, icon, trend, colorClass, onClick }: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-none shadow-md",
        onClick && "cursor-pointer transition-shadow hover:shadow-lg",
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex h-full">
          <div
            className={cn(
              "flex items-center justify-center w-[50px] md:w-[70px]",
              colorClass || "bg-primary text-primary-foreground",
            )}
          >
            {icon}
          </div>
          <div className="p-3 flex-1 overflow-hidden">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-bold truncate">{value}</p>
              {trend && (
                <div className={`flex items-center text-xs ${trend.isPositive ? "text-green-500" : "text-red-500"}`}>
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SummaryCards() {
  const router = useRouter()
  const [isAppointmentsDrawerOpen, setIsAppointmentsDrawerOpen] = useState(false)

  const handleOpenAppointmentsDrawer = () => {
    setIsAppointmentsDrawerOpen(true)
  }

  const handleOpenFinancialHealth = () => {
    router.push("/financial-health")
  }

  const handleOpenActiveLeads = () => {
    router.push("/leads")
  }

  // Mock data
  const summaryData = [
    {
      title: "Active Leads",
      value: 24,
      description: "6 need follow-up",
      icon: <Users className="h-5 w-5" />,
      trend: { value: 12, isPositive: true },
      colorClass: "bg-blue-500 text-white",
      onClick: handleOpenActiveLeads,
    },
    {
      title: "Appointments",
      value: 8,
      description: "This week",
      icon: <Calendar className="h-5 w-5" />,
      colorClass: "bg-purple-500 text-white",
      onClick: handleOpenAppointmentsDrawer,
    },
    {
      title: "Money to Collect",
      value: "$28,500",
      description: "Outstanding invoices",
      icon: <DollarSign className="h-5 w-5" />,
      trend: { value: 15, isPositive: true },
      colorClass: "bg-emerald-500 text-white",
      onClick: handleOpenFinancialHealth,
    },
  ]

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryData.map((card, index) => (
          <SummaryCard key={index} {...card} />
        ))}
      </div>
      <AppointmentsDrawer isOpen={isAppointmentsDrawerOpen} onClose={() => setIsAppointmentsDrawerOpen(false)} />
    </>
  )
}
