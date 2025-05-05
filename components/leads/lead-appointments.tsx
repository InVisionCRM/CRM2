"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Plus, Edit2, Trash2 } from "lucide-react"
import { useLeadAppointments } from "@/hooks/use-lead-appointments"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AppointmentStatus, AppointmentPurpose } from '@prisma/client'
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

interface PrismaAppointment {
  id: string
  title: string
  startTime: Date // Prisma DateTime maps to JS Date
  endTime: Date   // Prisma DateTime maps to JS Date
  purpose: AppointmentPurpose
  status: AppointmentStatus
  // Include other fields from Prisma model if needed by the component
}

interface LeadAppointmentsProps {
  leadId: string
}

// Define labels using string literals matching enum values
const LOCAL_PURPOSE_LABELS: { [key: string]: string } = {
  "INSPECTION": "Inspection",
  "FILE_CLAIM": "File Claim",
  "FOLLOW_UP": "Follow Up",
  "ADJUSTER": "Adjuster Meeting",
  "BUILD_DAY": "Build Day",
  "OTHER": "Other"
};

// Helper to get background color based on status
const getStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case "COMPLETED": return "bg-green-100";
    case "CANCELLED": return "bg-red-100";
    case "RESCHEDULED": return "bg-yellow-100";
    case "NO_SHOW": return "bg-gray-100";
    case "SCHEDULED": 
    default: return "bg-blue-100";
  }
}

// Use Prisma enum in function signature, but lookup with string key
const getPurposeLabel = (purpose: AppointmentPurpose): string => {
  // Access the label using the enum value (which is a string)
  return LOCAL_PURPOSE_LABELS[purpose] || purpose;
}

// Helper to format time from Date object
const formatTime = (date: Date): string => {
  return format(date, "p"); // e.g., 10:30 AM
}

// Helper for status labels (assuming STATUS_LABELS from constants might have issues too)
const getStatusLabel = (status: AppointmentStatus): string => {
  const labels: Record<AppointmentStatus, string> = {
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    RESCHEDULED: "Rescheduled",
    NO_SHOW: "No Show",
  };
  return labels[status] || status;
}

export function LeadAppointments({ leadId }: LeadAppointmentsProps) {
  const { appointments, isLoading, error, refreshAppointments } = useLeadAppointments(leadId)
  const { toast } = useToast()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null)

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return format(date, "MMM d, yyyy")
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-red-500">
            <p>Error loading appointments</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!appointments || appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No appointments scheduled.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Appointments</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Appointment</DialogTitle>
              </DialogHeader>
              {/* Appointment form will go here */}
              <div className="py-4">
                <p className="text-center text-muted-foreground">Appointment form coming soon</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className={`p-3 rounded-md border ${getStatusColor(appointment.status)}`}>
            <h4 className="font-medium">{appointment.title}</h4>
            <div className="flex items-center mb-1">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(appointment.startTime, "PPP")}
                 @ {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Purpose: {getPurposeLabel(appointment.purpose)}</p>
            <p className={`text-sm font-medium px-2 py-0.5 rounded inline-block`}>
              Status: {getStatusLabel(appointment.status)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
