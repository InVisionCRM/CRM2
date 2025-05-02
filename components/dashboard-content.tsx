"use client"

import { SummaryCards } from "@/components/dashboard/summary-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { DynamicHero } from "@/components/dynamic-components"

export function DashboardContent() {
  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Hero Section */}
      <DynamicHero />
      
      <div className="container mx-auto space-y-6 p-4">
        {/* Welcome message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Welcome back</h2>
        </div>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  )
}
