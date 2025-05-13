export const metadata = {
  title: "Active Leads | Roofing CRM",
  description: "Manage and track all your active leads",
}

import LeadsClient from "@/app/leads/LeadsClient"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function LeadsPage() {
  return (
    <div className="w-full">
      {/* Header section with Create Lead button */}
      <div className="w-full flex justify-end mb-10 pt-6 px-4">
        <Button 
          size="default"
          className="text-black font-medium bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 shadow-lg"
        >
          <Plus className="mr-1 h-4 w-4" />
          Create Lead
        </Button>
      </div>

      <LeadsClient />
    </div>
  )
}
