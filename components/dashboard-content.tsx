"use client"

import { QuickActions } from "@/components/dashboard/quick-actions"
import { DynamicHero } from "@/components/dynamic-components"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { WeatherForecast } from "@/components/dashboard/weather-forecast"

export function DashboardContent() {
  return (
    <div className="flex-1 h-full overflow-hidden">
      {/* Hero Section */}
      <DynamicHero />
      
      {/* Gradient Divider */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#59ff00]/50 to-transparent" />
      </div>
      
      {/* Quick Actions as Tabs */}
      <div className="container mx-auto px-4 py-3">
        <QuickActions />
      </div>
      
      {/* Gradient Divider */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#59ff00]/50 to-transparent" />
      </div>
      
      {/* Weather Forecast */}
      <div className="container mx-auto px-4 py-3">
        <WeatherForecast />
      </div>
      
      {/* Gradient Divider */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#59ff00]/50 to-transparent" />
      </div>
      
      {/* Recent Activities */}
      <div className="container mx-auto px-4 py-3">
        <RecentActivities />
      </div>
    </div>
  )
}
