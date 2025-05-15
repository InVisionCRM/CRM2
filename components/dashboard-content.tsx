"use client"

// import { SummaryCards } from "@/components/dashboard/summary-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DynamicHero } from "@/components/dynamic-components"
import { RecentActivities } from "@/components/dashboard/recent-activities"

export function DashboardContent() {
  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Hero Section */}
      <DynamicHero />
      
      <div className="container mx-auto p-4">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Quick Actions */}
            <QuickActions />
          </div>
          
          {/* Right column - Recent Activities */}
          <div className="md:col-span-1">
            <RecentActivities />
          </div>
        </div>
      </div>
    </div>
  )
}
