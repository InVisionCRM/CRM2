"use client"

import { QuickActions } from "@/components/dashboard/quick-actions"
import { DynamicHero } from "@/components/dynamic-components"
import { RecentActivities } from "@/components/dashboard/recent-activities"

export function DashboardContent() {
  return (
    <div className="flex-1 h-full overflow-hidden">
      {/* Hero Section */}
      <DynamicHero />
      
      {/* Quick Actions as Tabs */}
      <div className="container mx-auto px-4 py-6">
        <QuickActions />
      </div>
      
      {/* Recent Activities */}
      <div className="container mx-auto px-4 py-6">
        <RecentActivities />
      </div>
    </div>
  )
}
