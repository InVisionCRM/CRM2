import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardContent } from "@/components/dashboard-content"

export default function DashboardPage() {
  return (
      <div className="flex-1 overflow-auto">
        <DashboardContent />
    </div>
  )
}
