"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Check, AlertCircle } from "lucide-react"
// import { GeneralContract } from "@/components/general-contract"
import type { Lead } from "@/types/lead"
import { cn } from "@/lib/utils"

interface LeadContractSectionProps {
  lead: Lead
  className?: string
}

export function LeadContractSection({ lead, className }: LeadContractSectionProps) {
  // const [isContractSigned, setIsContractSigned] = useState(lead.contractSigned || false)
  const [isContractSigned, setIsContractSigned] = useState(false) // Initialize to false
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  /*
  const handleContractSigned = () => {
    setIsContractSigned(true)
    setIsDialogOpen(false)
  }
  */

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Contract
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isContractSigned ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <span className="font-medium">{isContractSigned ? "Contract Signed" : "Contract Pending"}</span>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant={isContractSigned ? "outline" : "default"} size="sm">
                  {isContractSigned ? "View Contract" : "Sign Contract"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
                {/* <GeneralContract lead={lead} onContractSigned={handleContractSigned} /> */}
                <div className="p-4">Contract functionality is temporarily unavailable.</div>
              </DialogContent>
            </Dialog>
          </div>

          {isContractSigned && (
            <div className="text-sm text-muted-foreground">Signed on {new Date().toLocaleDateString()}</div>
          )}

          {!isContractSigned && (
            <p className="text-sm text-muted-foreground">
              The customer needs to sign the contract before work can begin.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
