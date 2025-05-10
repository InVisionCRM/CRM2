export const metadata = {
  title: "Active Leads | Roofing CRM",
  description: "Manage and track all your active leads",
}

import LeadsClient from "@/app/leads/LeadsClient"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { WelcomeSecureLeadAnimationWrapper } from "@/components/welcome-secure-lead-animation-wrapper"

export default function LeadsPage() {
  return (
    <>
      <WelcomeSecureLeadAnimationWrapper />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Lead
          </Button>
        </div>

        <LeadsClient />
      </div>
    </>
  )
}
