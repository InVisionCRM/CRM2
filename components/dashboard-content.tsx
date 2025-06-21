"use client"

import { QuickActions } from "@/components/dashboard/quick-actions"
import { Hero } from "@/components/ui/hero"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { WeatherForecast } from "@/components/dashboard/weather-forecast"
import { PWAInstallSection } from "@/components/PWAInstallSection"
import { RecentUploads } from "@/components/dashboard/recent-uploads"
import { RecentEmails } from "@/components/dashboard/recent-emails"
import { MyLeads } from "@/components/dashboard/my-leads"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"

export function DashboardContent() {
  return (
    <div className="flex-1 h-full overflow-hidden">
      {/* Hero Section */}
      <Hero />
      
      {/* PWA Install Section */}
      <div className="container mx-auto px-4 py-6">
        <PWAInstallSection />
      </div>
      
      {/* Quick Actions and Upcoming Events Grid */}
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mobile: Upcoming Events first */}
          <div className="space-y-4 lg:order-2">
            <UpcomingEvents />
          </div>
          
          {/* Mobile: Quick Actions second, Desktop: First column */}
          <div className="space-y-4 lg:order-1">
            <QuickActions />
          </div>
        </div>
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
      
      {/* My Leads */}
      <div className="container mx-auto px-4 py-3">
        <MyLeads />
      </div>
      
      {/* Gradient Divider */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#59ff00]/50 to-transparent" />
      </div>
      
      {/* Recent Activities */}
      <div className="container mx-auto px-4 py-3">
        <RecentActivities />
      </div>
      
      {/* Gradient Divider */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#59ff00]/50 to-transparent" />
      </div>
      
      {/* Recent Uploads */}
      <div className="container mx-auto px-4 py-3">
        <RecentUploads />
      </div>

      {/* Gradient Divider */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#59ff00]/50 to-transparent" />
      </div>
      
      {/* Recent Emails */}
      <div className="container mx-auto px-4 py-3">
        <RecentEmails />
      </div>
    </div>
  )
}
