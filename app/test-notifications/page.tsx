"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send, AlertTriangle } from "lucide-react"

export default function TestNotificationsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [testData, setTestData] = useState({
    leadId: "test-lead-123",
    leadName: "John Doe",
    leadEmail: "john.doe@example.com",
    leadAddress: "123 Main Street, Anytown, USA",
    leadStatus: "new_leads",
    deletionReason: "Testing notification system"
  })

  const handleTestNotification = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test notifications",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/test/lead-deletion-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "✅ Test Notification Sent",
          description: "Check admin email inboxes for the test notification",
        })
      } else {
        toast({
          title: "❌ Test Failed",
          description: result.error || "Failed to send test notification",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Test notification error:", error)
      toast({
        title: "❌ Test Failed",
        description: "Network error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Lead Deletion Notification Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the lead deletion notification system without actually deleting leads
          </p>
        </div>

        {!session ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Please log in to test the notification system.</p>
            </CardContent>
          </Card>
        ) : !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Admin Access Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Only admin users can test the notification system.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Current user: {session.user.name} ({session.user.email})
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>
                  Customize the test notification data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leadId">Lead ID</Label>
                    <Input
                      id="leadId"
                      value={testData.leadId}
                      onChange={(e) => setTestData(prev => ({ ...prev, leadId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadName">Lead Name</Label>
                    <Input
                      id="leadName"
                      value={testData.leadName}
                      onChange={(e) => setTestData(prev => ({ ...prev, leadName: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="leadEmail">Lead Email</Label>
                  <Input
                    id="leadEmail"
                    type="email"
                    value={testData.leadEmail}
                    onChange={(e) => setTestData(prev => ({ ...prev, leadEmail: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="leadAddress">Lead Address</Label>
                  <Input
                    id="leadAddress"
                    value={testData.leadAddress}
                    onChange={(e) => setTestData(prev => ({ ...prev, leadAddress: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leadStatus">Lead Status</Label>
                    <Input
                      id="leadStatus"
                      value={testData.leadStatus}
                      onChange={(e) => setTestData(prev => ({ ...prev, leadStatus: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deletionReason">Deletion Reason</Label>
                    <Input
                      id="deletionReason"
                      value={testData.deletionReason}
                      onChange={(e) => setTestData(prev => ({ ...prev, deletionReason: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Test Notification</CardTitle>
                <CardDescription>
                  This will send a test notification to all admin users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleTestNotification}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Test Notification...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {session.user.name}</p>
                  <p><strong>Email:</strong> {session.user.email}</p>
                  <p><strong>Role:</strong> {session.user.role}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
} 