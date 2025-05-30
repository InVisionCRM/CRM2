"use client"

import { QuickActions } from "@/components/dashboard/quick-actions"
import { DynamicHero } from "@/components/dynamic-components"
import { RecentActivities } from "@/components/dashboard/recent-activities"

export function DashboardContent() {
  return (
    <div className="flex-1 h-full overflow-hidden">
      {/* Hero Section */}
      <DynamicHero />
      
      <div className="container mx-auto p-4 h-[calc(100%-theme(space.32))] overflow-hidden">
        {/* Two-column layout */}
        <div className="flex gap-2 h-full">
          {/* Left column - Main content */}
          <div className="flex-1 overflow-y-auto">
            <QuickActions />
          </div>
          
          {/* Right column - Recent Activities */}
          <div className="flex-1 overflow-y-auto">
            <RecentActivities />
          </div>
        </div>
      </div>
    </div>
  )
}
