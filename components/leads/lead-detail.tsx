"use client"

import { useState } from "react"
import type { Lead } from "@/types/lead"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadFiles } from "@/components/leads/lead-files"
import { LeadInfo } from "@/components/leads/lead-info"
import { LeadNotes } from "@/components/leads/lead-notes"
import { LeadInsurance } from "@/components/leads/lead-insurance"
import { LeadTimeline } from "@/components/leads/lead-timeline"

interface LeadDetailProps {
  lead: Lead
}

export function LeadDetail({ lead }: LeadDetailProps) {
  const [activeTab, setActiveTab] = useState("info")

  if (!lead) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No lead data available
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {lead.firstName} {lead.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="mt-4">
              <LeadInfo lead={lead} />
            </TabsContent>
            <TabsContent value="insurance" className="mt-4">
              <LeadInsurance lead={lead} />
            </TabsContent>
            <TabsContent value="files" className="mt-4">
              <LeadFiles leadId={lead.id} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <LeadNotes leadId={lead.id} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-4">
              <LeadTimeline leadId={lead.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
