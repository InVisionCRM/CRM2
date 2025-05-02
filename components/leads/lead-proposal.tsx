"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

interface LeadProposalProps {
  leadId: string
}

export function LeadProposal({ leadId }: LeadProposalProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Proposal</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No proposal created yet</h3>
          <p className="text-muted-foreground mb-6">Create a proposal for this lead to present to the client</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
