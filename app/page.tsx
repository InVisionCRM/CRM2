import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardContent } from "@/components/dashboard-content"

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
      <div className="flex-1 overflow-auto">
        <DashboardContent />
    </div>
  )
}
