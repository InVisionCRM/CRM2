export const metadata = {
  title: "Active Leads | Roofing CRM",
  description: "Manage and track all your active leads",
}

import LeadsClient from "@/app/leads/LeadsClient"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function LeadsPage() {
  return (
    <div>
      <Button size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Create Lead
      </Button>

      <LeadsClient />
    </div>
  )
}
