"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { FileText, Check, AlertCircle, Eye, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Lead } from "@/types/lead"
import { cn } from "@/lib/utils"

interface LeadContractSectionProps {
  lead: Lead
  className?: string
}

export function LeadContractSection({ lead, className }: LeadContractSectionProps) {
  const { toast } = useToast()
  
  // Contract status can be: 'pending', 'completed', or 'signed'
  const [contractStatus, setContractStatus] = useState<'pending' | 'completed' | 'signed'>('pending')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadedContractUrl, setUploadedContractUrl] = useState<string | null>(null)
  const [isCheckingContract, setIsCheckingContract] = useState(true)

  // Check if General Contract file exists
  const checkContractExists = async () => {
    if (!lead?.id) return { exists: false, fileUrl: null }
    
    try {
      console.log('🔍 Checking for general_contract file for lead:', lead.id)
      const response = await fetch(`/api/files/check-file-exists?leadId=${lead.id}&fileType=general_contract`)
      if (!response.ok) {
        console.log('❌ API response not ok:', response.status, response.statusText)
        return { exists: false, fileUrl: null }
      }
      const data = await response.json()
      console.log('📄 File check result:', data)
      return { exists: data.exists as boolean, fileUrl: data.fileUrl as string | null }
    } catch (error) {
      console.error('❌ Error checking general contract file:', error)
      return { exists: false, fileUrl: null }
    }
  }

  // Check for uploaded contract on component mount and when lead changes
  useEffect(() => {
    const checkUploadedContract = async () => {
      if (!lead?.id) return
      
      setIsCheckingContract(true)
      const result = await checkContractExists()
      
      if (result.exists) {
        setContractStatus('completed')
        setUploadedContractUrl(result.fileUrl)
        console.log('✅ General Contract found, marking as completed')
      } else {
        // Reset to pending if no file found (unless manually overridden)
        if (contractStatus === 'completed' && uploadedContractUrl) {
          setContractStatus('pending')
          setUploadedContractUrl(null)
          console.log('📝 General Contract no longer found, reverting to pending')
        }
      }
      
      setIsCheckingContract(false)
    }

    checkUploadedContract()
    
    // Also check periodically for real-time updates when files are uploaded
    const interval = setInterval(checkUploadedContract, 3000) // Check every 3 seconds
    
    return () => clearInterval(interval)
  }, [lead?.id])

  // Also listen for focus events to check when user returns to the page
  useEffect(() => {
    const handleFocus = async () => {
      if (!lead?.id) return
      const result = await checkContractExists()
      if (result.exists && contractStatus !== 'completed') {
        setContractStatus('completed')
        setUploadedContractUrl(result.fileUrl)
        console.log('✅ General Contract detected on focus, marking as completed')
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [lead?.id, contractStatus])

  // Toggle contract status manually
  const handleToggleStatus = () => {
    if (contractStatus === 'pending') {
      setContractStatus('completed')
      toast({
        title: "Contract Status Updated",
        description: "Contract marked as completed",
      })
    } else if (contractStatus === 'completed') {
      setContractStatus('pending')
      toast({
        title: "Contract Status Updated", 
        description: "Contract marked as pending",
      })
    }
    // Note: 'signed' status would be handled by DocuSeal integration
  }

  // Handle viewing contract
  const handleViewContract = () => {
    if (uploadedContractUrl) {
      // Open uploaded contract
      window.open(uploadedContractUrl, '_blank')
    } else {
      // Open dialog for other contract functionality (signing, etc.)
      setIsDialogOpen(true)
    }
  }

  // Manual refresh function
  const handleRefreshContractStatus = async () => {
    console.log('🔄 Manually refreshing contract status...')
    setIsCheckingContract(true)
    const result = await checkContractExists()
    
    if (result.exists) {
      setContractStatus('completed')
      setUploadedContractUrl(result.fileUrl)
      toast({
        title: "Contract Status Updated",
        description: "General contract detected and marked as completed",
      })
      console.log('✅ Manual refresh: General Contract found, marking as completed')
    } else {
      console.log('📝 Manual refresh: No general contract found')
      toast({
        title: "Contract Status Checked",
        description: "No general contract found in uploads",
      })
    }
    
    setIsCheckingContract(false)
  }

  const getStatusColor = () => {
    switch (contractStatus) {
      case 'completed':
      case 'signed':
        return 'border-green-500 text-green-700 bg-green-50'
      case 'pending':
      default:
        return 'border-amber-500 text-amber-700 bg-amber-50'
    }
  }

  const getStatusIcon = () => {
    switch (contractStatus) {
      case 'completed':
      case 'signed':
        return <Check className="h-4 w-4" />
      case 'pending':
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (contractStatus) {
      case 'completed':
        return uploadedContractUrl ? 'Contract Uploaded' : 'Contract Completed'
      case 'signed':
        return 'Contract Signed'
      case 'pending':
      default:
        return 'Contract Pending'
    }
  }

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
              {/* Clickable status badge */}
              <Badge 
                className={cn(
                  "cursor-pointer transition-colors hover:opacity-80",
                  getStatusColor()
                )}
                onClick={handleToggleStatus}
                title="Click to toggle contract status"
              >
                {getStatusIcon()}
                <span className="ml-1 capitalize">{getStatusText()}</span>
              </Badge>
              {/* Toggle switch for manual completion */}
              <Switch
                checked={contractStatus === 'completed'}
                onCheckedChange={(checked) => setContractStatus(checked ? 'completed' : 'pending')}
                aria-label="Toggle contract completion"
              />
              {isCheckingContract && (
                <span className="text-xs text-muted-foreground">Checking...</span>
              )}
              {!isCheckingContract && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshContractStatus}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Refresh contract status"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {(contractStatus === 'completed' || contractStatus === 'signed') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleViewContract}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Contract
                </Button>
              )}
              
              {contractStatus === 'pending' && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm">
                      Sign Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Contract Signing</h3>
                      <p className="text-muted-foreground">
                        Contract functionality is temporarily unavailable. 
                        {uploadedContractUrl ? ' You can view the uploaded contract using the "View Contract" button.' : ' Upload a contract through the Upload to Drive section above.'}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {contractStatus === 'completed' && uploadedContractUrl && (
            <div className="text-sm text-muted-foreground">
              Contract uploaded to Google Drive
            </div>
          )}

          {contractStatus === 'signed' && (
            <div className="text-sm text-muted-foreground">
              Signed on {new Date().toLocaleDateString()}
            </div>
          )}

          {contractStatus === 'pending' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                The customer needs to sign the contract before work can begin.
              </p>
              <p className="text-xs text-muted-foreground">
                💡 Tip: Upload a "General Contract" in the Upload to Drive section above, or click the status badge to manually mark as completed.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
