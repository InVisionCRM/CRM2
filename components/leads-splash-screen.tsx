"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDistanceToNow, format } from "date-fns"
import { Clock, User, Phone, Mail, Calendar, X, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface Lead {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  status: string
  lastInteraction?: string
  createdAt: string
}

interface LeadsSplashScreenProps {
  isOpen: boolean
  onClose: () => void
}

export function LeadsSplashScreen({ isOpen, onClose }: LeadsSplashScreenProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchInactiveLeads()
    }
  }, [isOpen, session?.user])

  const fetchInactiveLeads = async () => {
    setIsLoading(true)
    try {
      // Calculate date 1 week ago
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const response = await fetch(`/api/leads?lastInteractionBefore=${oneWeekAgo.toISOString()}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      } else {
        console.error("Failed to fetch inactive leads")
        setLeads([])
      }
    } catch (error) {
      console.error("Error fetching inactive leads:", error)
      setLeads([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateLead = (lead: Lead) => {
    setSelectedLead(lead)
  }

  const handleNavigateToLead = () => {
    if (selectedLead) {
      router.push(`/leads/${selectedLead.id}`)
      onClose()
      toast({
        title: "Navigating to Lead",
        description: `Opening ${selectedLead.firstName} ${selectedLead.lastName}'s profile...`,
      })
    }
  }

  const handleDismiss = () => {
    onClose()
    toast({
      title: "Splash Screen Dismissed",
      description: "You can always check for inactive leads in the leads section.",
    })
  }

  const formatLastInteraction = (dateString?: string) => {
    if (!dateString) return "No interactions"
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy 'at' h:mm a")
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Inactive Leads Alert</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  These leads haven't been contacted in over a week
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                Great job! All your leads have been contacted within the last week.
              </p>
            </div>
          ) : (
            leads.map((lead) => (
              <Card key={lead.id} className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {lead.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Last contact: {formatLastInteraction(lead.lastInteraction)}</span>
                        </div>
                        {lead.lastInteraction && (
                          <div className="text-xs opacity-75">
                            {formatDate(lead.lastInteraction)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleUpdateLead(lead)}
                      className="ml-4 flex-shrink-0"
                      size="sm"
                    >
                      Update Client
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {leads.length > 0 && (
          <div className="flex-shrink-0 pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {leads.length} lead{leads.length !== 1 ? 's' : ''} need{leads.length !== 1 ? '' : 's'} attention
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDismiss}>
                  Dismiss
                </Button>
                <Button onClick={() => router.push('/leads')}>
                  View All Leads
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 