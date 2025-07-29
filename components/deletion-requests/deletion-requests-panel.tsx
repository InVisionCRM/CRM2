"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Clock, User, Mail, MapPin, Calendar, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface DeletionRequest {
  id: string
  leadId: string
  leadName: string
  leadEmail: string
  leadAddress: string
  leadStatus: string
  requestedBy: {
    id: string
    name: string
    email: string
  }
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  approvedBy?: {
    id: string
    name: string
    email: string
  }
  approvedAt?: Date
  rejectionReason?: string
}

export function DeletionRequestsPanel() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<DeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/deletion-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        console.error('Failed to fetch deletion requests')
      }
    } catch (error) {
      console.error('Error fetching deletion requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/deletion-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success("Deletion request approved successfully")
        fetchRequests() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to approve request")
      }
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error("Failed to approve request")
    }
  }

  const rejectRequest = async (requestId: string, reason: string) => {
    try {
      const response = await fetch(`/api/deletion-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      })

      if (response.ok) {
        toast.success("Deletion request rejected successfully")
        setRejectionReason("")
        setSelectedRequest(null)
        fetchRequests() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to reject request")
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error("Failed to reject request")
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deletion Requests</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deletion Requests</CardTitle>
          <CardDescription>No pending deletion requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>All caught up! No pending deletion requests.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Deletion Requests ({requests.length})
        </CardTitle>
        <CardDescription>
          Review and approve/reject lead deletion requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{request.leadName}</h3>
                    <Badge variant="secondary">{request.leadStatus}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {request.leadEmail || 'No email'}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {request.leadAddress || 'No address'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Requested by: {request.requestedBy.name} ({request.requestedBy.email})
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(request.createdAt)}
                  </div>

                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Reason:</span> {request.reason}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Deletion Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to approve the deletion of "{request.leadName}"? 
                          This action cannot be undone and the lead will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => approveRequest(request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve Deletion
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Deletion Request</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for rejecting the deletion of "{request.leadName}".
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Enter rejection reason..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRejectionReason("")
                            setSelectedRequest(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => selectedRequest && rejectRequest(selectedRequest.id, rejectionReason)}
                          disabled={!rejectionReason.trim()}
                        >
                          Reject Request
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 