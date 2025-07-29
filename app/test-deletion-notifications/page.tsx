"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Mail, Send } from "lucide-react"

export default function TestDeletionNotificationsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    leadName: "Test Lead",
    leadEmail: "test@example.com",
    leadAddress: "123 Test Street, City, State 12345"
  })

  const sendTestNotification = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to test notifications")
      return
    }

    if (session.user.role !== 'ADMIN') {
      toast.error("Only admins can test notifications")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test/deletion-request-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Test notification sent successfully!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send test notification")
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error("Failed to send test notification")
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Deletion Notifications</CardTitle>
            <CardDescription>Please log in to test the notification system</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (session.user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Deletion Notifications</CardTitle>
            <CardDescription>Only admins can test the notification system</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Deletion Notifications</h1>
          <p className="text-muted-foreground">
            Send test deletion request notifications to all admins
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test Notification
          </CardTitle>
          <CardDescription>
            This will send a test deletion request notification to all admin users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadName">Lead Name</Label>
              <Input
                id="leadName"
                value={formData.leadName}
                onChange={(e) => setFormData(prev => ({ ...prev, leadName: e.target.value }))}
                placeholder="Test Lead"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadEmail">Lead Email</Label>
              <Input
                id="leadEmail"
                value={formData.leadEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, leadEmail: e.target.value }))}
                placeholder="test@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadAddress">Lead Address</Label>
              <Input
                id="leadAddress"
                value={formData.leadAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, leadAddress: e.target.value }))}
                placeholder="123 Test Street"
              />
            </div>
          </div>

          <Button 
            onClick={sendTestNotification} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              "Sending..."
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
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Test Notification</h3>
            <p className="text-sm text-muted-foreground">
              Click the button above to send a test deletion request notification to all admin users.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">2. Check Email</h3>
            <p className="text-sm text-muted-foreground">
              All admin users will receive an email with the test lead details and approval links.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">3. Real Notifications</h3>
            <p className="text-sm text-muted-foreground">
              When users request lead deletions, admins will automatically receive similar notifications.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 