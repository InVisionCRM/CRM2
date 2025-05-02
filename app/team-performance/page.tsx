"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockPerformanceData } from "@/lib/mock-performance-data"
import { PerformanceSummaryCard } from "@/components/team/performance-summary-card"
import { SalesLeaderboard } from "@/components/team/sales-leaderboard"
import { PerformanceMetricsCard } from "@/components/team/performance-metrics-card"
import { UserFilter, type UserOption } from "@/components/user-filter"

// Create user options from team members
const userOptions: UserOption[] = mockPerformanceData.teamMembers.map((member) => ({
  id: member.id,
  name: member.name,
}))

export default function TeamPerformancePage() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  // Filter team members based on selected user
  const filteredData = {
    ...mockPerformanceData,
    teamMembers: selectedUser
      ? mockPerformanceData.teamMembers.filter((member) => member.id === selectedUser)
      : mockPerformanceData.teamMembers,
  }

  return (
    // Full viewport height, column layout
    <div className="h-screen flex flex-col">
      {/* Header area (does not scroll) */}
      <header className="px-4 py-4 container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Team Performance</h1>
          </div>
          <UserFilter users={userOptions} selectedUser={selectedUser} onUserChange={setSelectedUser} />
        </div>
      </header>

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 container mx-auto max-w-7xl">
        <div className="space-y-6">
          <PerformanceSummaryCard data={filteredData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesLeaderboard teamMembers={filteredData.teamMembers} />
            <PerformanceMetricsCard teamMembers={filteredData.teamMembers} />
          </div>
        </div>
      </main>
    </div>
  )
}
