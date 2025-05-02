"use client"

import { SummaryCards } from "@/components/dashboard/summary-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { DynamicHero } from "@/components/dynamic-components"

export function DashboardContent() {
  const [isToggled, setIsToggled] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto pb-20 bg-gray-50 dark:bg-black">
      {/* Hero Section */}
      <DynamicHero />
      
      <div className="container mx-auto space-y-6 p-4">
        {/* Welcome message and search */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Toggle Feature</label>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={isToggled}
                onChange={(e) => setIsToggled(e.target.checked)}
                aria-label="Toggle feature"
              />
            </div>
            <div className="relative w-full max-w-xs">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1 h-9 rounded-full border-gray-200 focus:border-primary"
              />
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6">
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}
