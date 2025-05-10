"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { LeadPropertyDetails } from "./lead-property-details"
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
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("details")
  const [isAppointmentDrawerOpen, setIsAppointmentDrawerOpen] = useState(false)

  const currentUserId = (session?.user as any)?.id

  return (
    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-6 mb-4">
        <TabsTrigger value="details" style={{ color: 'yellow' }}>Details</TabsTrigger>
        <TabsTrigger value="appointments" style={{ color: 'yellow' }}>Appointments</TabsTrigger>
        <TabsTrigger value="files" style={{ color: 'yellow' }}>Files</TabsTrigger>
        <TabsTrigger value="scope" style={{ color: 'yellow' }}>Scope of Work</TabsTrigger>
        <TabsTrigger value="contract" style={{ color: 'yellow' }}>Contract</TabsTrigger>
        <TabsTrigger value="history" style={{ color: 'yellow' }}>History</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        {/* <LeadPropertyDetails lead={lead} /> */}
        <div>Lead Property Details (temporarily unavailable)</div>
      </TabsContent>

      <TabsContent value="appointments" className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Appointments</h2>
          <Button onClick={() => setIsAppointmentDrawerOpen(true)} size="sm" disabled={!currentUserId}>
            <Plus className="h-4 w-4 mr-1" /> Add Appointment
          </Button>
        </div>
        <LeadAppointments leadId={lead.id} />
        {currentUserId && 
          <AppointmentsDrawer 
            isOpen={isAppointmentDrawerOpen} 
            onClose={() => setIsAppointmentDrawerOpen(false)} 
            leadId={lead.id} 
            userId={currentUserId} 
          />
        }
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
