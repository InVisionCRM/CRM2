"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { FileText, Send, PenTool } from "lucide-react"
import type { Lead } from "@prisma/client"

interface ContractsSectionProps {
  lead: Lead | null
  className?: string
}

export function ContractsSection({ lead, className }: ContractsSectionProps) {
  const [isSendingContract, setIsSendingContract] = useState(false)
  const [isSigningInPerson, setIsSigningInPerson] = useState(false)

  const handleSendThirdPartyAuth = async () => {
    if (!lead) return
    
    setIsSendingContract(true)
    
    try {
      const response = await fetch('/api/docuseal/send-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: lead.id,
          templateId: 3, // 3rd Party Auth template
          additionalData: {
            insuranceCompany: lead.insuranceCompany || '',
            claimNumber: lead.claimNumber || ''
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "✅ Contract Sent!",
          description: `3rd Party Authorization has been sent to ${lead.email}`,
        })
      } else {
        throw new Error('Failed to send contract')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send 3rd Party Authorization. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingContract(false)
    }
  }

  const handleSendScopeOfWork = async () => {
    if (!lead) return
    
    setIsSendingContract(true)
    
    try {
      const response = await fetch('/api/docuseal/send-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: lead.id,
          templateId: 4 // Scope of Work template
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "✅ Contract Sent!",
          description: `Scope of Work has been sent to ${lead.email}`,
        })
      } else {
        throw new Error('Failed to send contract')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send Scope of Work. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingContract(false)
    }
  }

  const handleSendWarranty = async () => {
    if (!lead) return
    
    setIsSendingContract(true)
    
    try {
      const response = await fetch('/api/docuseal/send-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: lead.id,
          templateId: 5 // Warranty template
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "✅ Contract Sent!",
          description: `Warranty has been sent to ${lead.email}`,
        })
      } else {
        throw new Error('Failed to send contract')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send Warranty. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingContract(false)
    }
  }

  return (
    <Card className={className}>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={handleSendThirdPartyAuth}
            disabled={!lead || isSendingContract}
            className="h-16 p-2 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all duration-200 bg-transparent bg-black/60 text-white hover:bg-gray-800/50"
          >
            <FileText className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-center leading-tight">
              3rd Party Auth
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={handleSendScopeOfWork}
            disabled={!lead || isSendingContract}
            className="h-16 p-2 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all duration-200 bg-transparent bg-black/60 text-white hover:bg-gray-800/50"
          >
            <Send className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-center leading-tight">
              Scope of Work
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={handleSendWarranty}
            disabled={!lead || isSendingContract}
            className="h-16 p-2 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all duration-200 bg-transparent bg-black/60 text-white hover:bg-gray-800/50"
          >
            <PenTool className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-center leading-tight">
              Warranty
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 