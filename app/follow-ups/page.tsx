"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarDays, Clock, MapPin, User, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { KnockStatus } from "@prisma/client"

interface FollowUp {
  id: string
  address: string
  followUpDate: string
  followUpTime: string
  followUpNotes: string | null
  status: KnockStatus
  lead?: {
    firstName: string | null
    lastName: string | null
  } | null
  user?: {
    name: string | null
  } | null
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const { toast } = useToast()

  useEffect(() => {
    fetchFollowUps()
  }, [activeTab])

  const fetchFollowUps = async () => {
    try {
      const response = await fetch(`/api/visits/follow-ups?type=${activeTab}`)
      if (!response.ok) throw new Error("Failed to fetch follow-ups")
      const data = await response.json()
      setFollowUps(data)
    } catch (error) {
      console.error("Error fetching follow-ups:", error)
      toast({
        title: "Error",
        description: "Failed to load follow-ups",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const completeFollowUp = async (id: string) => {
    try {
      const response = await fetch(`/api/visits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      })

      if (!response.ok) throw new Error("Failed to update follow-up")

      toast({
        title: "Success",
        description: "Follow-up marked as completed",
      })

      fetchFollowUps()
    } catch (error) {
      console.error("Error completing follow-up:", error)
      toast({
        title: "Error",
        description: "Failed to complete follow-up",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: KnockStatus) => {
    const colors = {
      NOT_VISITED: "bg-gray-500",
      KNOCKED: "bg-blue-500",
      NO_ANSWER: "bg-yellow-500",
      INTERESTED: "bg-green-500",
      APPOINTMENT_SET: "bg-purple-500",
    }
    return colors[status] || "bg-gray-500"
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Follow-ups</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading follow-ups...</div>
          ) : followUps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {activeTab} follow-ups found
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {followUps.map((followUp) => (
                <Card key={followUp.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">
                        {followUp.lead
                          ? `${followUp.lead.firstName} ${followUp.lead.lastName}`
                          : "No Lead Name"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(
                          followUp.status
                        )}`}
                      >
                        {followUp.status.replace(/_/g, " ")}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{followUp.address}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          {format(new Date(followUp.followUpDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{followUp.followUpTime}</span>
                      </div>
                      {followUp.user && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          <span>{followUp.user.name || "Unknown User"}</span>
                        </div>
                      )}
                      {followUp.followUpNotes && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          <span className="truncate">
                            {followUp.followUpNotes}
                          </span>
                        </div>
                      )}
                      <div className="pt-4">
                        <Button
                          className="w-full"
                          onClick={() => completeFollowUp(followUp.id)}
                        >
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 