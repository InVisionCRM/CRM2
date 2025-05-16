"use client"

import { useState } from "react"
import LeadsClient from "@/app/leads/LeadsClient"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateLeadForm } from "@/components/forms/CreateLeadForm"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function LeadsPage() {
  const [openCreateForm, setOpenCreateForm] = useState(false)
  const router = useRouter()

  const handleLeadCreated = (leadId: string) => {
    toast({
      title: "Lead Created",
      description: "New lead has been successfully created.",
      variant: "default",
    })
    router.refresh() // Refresh the page to show the new lead
  }

  return (
    <div className="w-full">
      {/* Header section with Create Lead button */}
      <div className="w-full flex justify-end mb-10 pt-6 px-4">
        <Button 
          size="default"
          className="text-black font-medium bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 shadow-lg"
          onClick={() => setOpenCreateForm(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Create Lead
        </Button>
      </div>

      {/* Create Lead Form Dialog */}
      <CreateLeadForm
        open={openCreateForm}
        onOpenChange={setOpenCreateForm}
        onSuccess={handleLeadCreated}
      />

      <LeadsClient />
    </div>
  )
}
