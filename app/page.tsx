import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardContent } from "@/components/dashboard-content"

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader />
      <DashboardContent />
    </div>
  )
}
