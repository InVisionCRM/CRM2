"use client"

// import { SummaryCards } from "@/components/dashboard/summary-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DynamicHero } from "@/components/dynamic-components"

export function DashboardContent() {
  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Hero Section */}
      <DynamicHero />
      
      <div className="container mx-auto space-y-6 p-4">
        {/* Welcome message removed */}

        {/* Summary Cards removed */}
        {/* <SummaryCards /> */}

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  )
}
