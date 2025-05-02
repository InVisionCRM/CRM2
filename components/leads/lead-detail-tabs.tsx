"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadPropertyDetails } from "./lead-property-details"
import { LeadNotes } from "./lead-notes"
import { LeadFiles } from "./lead-files"
import { LeadAppointments } from "./lead-appointments"
import { LeadStatusHistory } from "./lead-status-history"
import { LeadContractSection } from "./lead-contract-section"
import { LeadScopeOfWork } from "./lead-scope-of-work"
import { AppointmentsDrawer } from "@/components/appointments/appointments-drawer"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Lead } from "@/types/lead"

interface LeadDetailTabsProps {
  lead: Lead
}

export function LeadDetailTabs({ lead }: LeadDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [isAppointmentDrawerOpen, setIsAppointmentDrawerOpen] = useState(false)

  return (
    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-6 mb-4">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="appointments">Appointments</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="scope">Scope of Work</TabsTrigger>
        <TabsTrigger value="contract">Contract</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <LeadPropertyDetails lead={lead} />
      </TabsContent>

      <TabsContent value="appointments" className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Appointments</h2>
          <Button onClick={() => setIsAppointmentDrawerOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Appointment
          </Button>
        </div>
        <LeadAppointments leadId={lead.id} />
        <AppointmentsDrawer isOpen={isAppointmentDrawerOpen} onClose={() => setIsAppointmentDrawerOpen(false)} />
      </TabsContent>

      <TabsContent value="files" className="space-y-4">
        <LeadFiles leadId={lead.id} />
      </TabsContent>

      <TabsContent value="scope" className="space-y-4">
        <LeadScopeOfWork lead={lead} />
      </TabsContent>

      <TabsContent value="contract" className="space-y-4">
        <LeadContractSection lead={lead} />
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        <LeadStatusHistory lead={lead} />
      </TabsContent>

      {/* Notes Section */}
      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
        </div>
        <LeadNotes leadId={lead.id} />
      </div>
    </Tabs>
  )
}
