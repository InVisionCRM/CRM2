"use client"

import { useState, useEffect } from "react"
import { Hero } from "@/components/ui/hero"
import { GlobalStats } from "@/components/dashboard/global-stats"
import { RecentActivities } from "@/components/dashboard/recent-activities"

import { RecentUploads } from "@/components/dashboard/recent-uploads"
import { RecentEmails } from "@/components/dashboard/recent-emails"
import { MyLeads } from "@/components/dashboard/my-leads"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { LeadsSplashScreen } from "@/components/leads-splash-screen"

export function DashboardContent() {
  const [showSplashScreen, setShowSplashScreen] = useState(false)

  useEffect(() => {
    // Show splash screen only on first load
    // Check if we're in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const hasSeenSplash = localStorage.getItem('hasSeenSplashToday')
      const today = new Date().toDateString()
      
      if (hasSeenSplash !== today) {
        setShowSplashScreen(true)
        localStorage.setItem('hasSeenSplashToday', today)
      }
    }
  }, [])

  const handleCloseSplashScreen = () => {
    setShowSplashScreen(false)
  }

  return (
    <div className="flex-1 h-full overflow-y-auto">
      <LeadsSplashScreen 
        isOpen={showSplashScreen} 
        onClose={handleCloseSplashScreen} 
      />
      {/* Hero Section */}
      <Hero />
      
      {/* Global Stats Section */}
      <div className="container mx-auto px-4 py-6">
        <GlobalStats />
      </div>
      

      
      {/* Upcoming Events */}
      <div className="container mx-auto px-4 py-3">
        <UpcomingEvents />
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
