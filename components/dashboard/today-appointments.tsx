"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AppointmentsDrawer } from "@/components/appointments/appointments-drawer"

interface Appointment {
  id: string
  clientName: string
  address: string
  date: Date
  time: string
  status: "scheduled" | "completed" | "cancelled" | "rescheduled"
  purpose: string
  leadId: string
}

// Sample mock data
const mockAppointments: Appointment[] = [
  {
    id: "1",
    clientName: "John Smith",
    address: "123 Main St, Anytown",
    date: new Date(),
    time: "10:30 AM",
    status: "scheduled",
    purpose: "Initial Assessment",
    leadId: "1",
  },
  {
    id: "2",
    clientName: "Sarah Johnson",
    address: "456 Oak Ave, Somewhere",
    date: new Date(),
    time: "2:00 PM",
    status: "rescheduled",
    purpose: "Measurement",
    leadId: "2",
  },
  {
    id: "3",
    clientName: "Michael Brown",
    address: "789 Pine Rd, Elsewhere",
    date: new Date(),
    time: "4:30 PM",
    status: "scheduled",
    purpose: "Contract Signing",
    leadId: "3",
  },
]

// Status color mapping
const getStatusColor = (status: string) => {
  const statusColors = {
    scheduled: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
    rescheduled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
  }
  return statusColors[status as keyof typeof statusColors] || ""
}

// Purpose color mapping
const getPurposeColor = (purpose: string) => {
  // Simple hash function to generate consistent colors
  const hash = purpose.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-cyan-500",
  ]
  return colors[hash % colors.length]
}

export function TodayAppointments() {
  const [isAppointmentsDrawerOpen, setIsAppointmentsDrawerOpen] = useState(false)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Today's Appointments</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setIsAppointmentsDrawerOpen(true)}>
          <span className="text-xs">View All</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pb-2">
        {mockAppointments.length > 0 ? (
          <div className="space-y-2">
            {mockAppointments.map((appointment) => (
              <Link href={`/leads/${appointment.leadId}`} key={appointment.id} className="block group">
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-all group-hover:shadow-md">
                  <div
                    className="flex border-l-4 relative"
                    style={{ borderLeftColor: `var(--${getPurposeColor(appointment.purpose)})` }}
                  >
                    {/* Time column */}
                    <div className="w-20 flex-none px-2 py-3 text-center border-r border-gray-100 dark:border-gray-700">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{appointment.time}</div>
                      <div className="text-[10px] uppercase text-gray-500">
                        {formatDate(appointment.date).split(",")[0]}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium">{appointment.clientName}</h3>
                        <Badge className={cn("font-normal text-[10px]", getStatusColor(appointment.status))}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex text-xs text-muted-foreground">
                        <div className="flex items-center mr-3">
                          <MapPin className="h-3 w-3 mr-1 shrink-0" />
                          <span className="truncate">{appointment.address}</span>
                        </div>
                      </div>

                      <div className="mt-2 inline-block bg-gray-100 dark:bg-gray-700 rounded-sm px-1.5 py-0.5 text-[10px]">
                        {appointment.purpose}
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-muted-foreground text-sm">No appointments scheduled for today</p>
            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Schedule Appointment
            </Button>
          </div>
        )}
      </CardContent>
      <AppointmentsDrawer isOpen={isAppointmentsDrawerOpen} onClose={() => setIsAppointmentsDrawerOpen(false)} />
    </Card>
  )
}
