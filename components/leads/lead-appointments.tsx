"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Plus, Edit2, Trash2 } from "lucide-react"
import { useLeadAppointments } from "@/hooks/use-lead-appointments"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { AppointmentPurpose, AppointmentStatus } from "@/types/appointments"
import { format } from "date-fns"

interface LeadAppointmentsProps {
  leadId: string
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

  const formatTime = (timeString: string) => {
    // Assuming timeString is in HH:MM format
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getPurposeLabel = (purpose: AppointmentPurpose) => {
    switch (purpose) {
      case "INITIAL_CONSULTATION":
        return "Initial Consultation"
      case "INSPECTION":
        return "Inspection"
      case "ESTIMATE_REVIEW":
        return "Estimate Review"
      case "CONTRACT_SIGNING":
        return "Contract Signing"
      case "INSTALLATION":
        return "Installation"
      case "FINAL_INSPECTION":
        return "Final Inspection"
      case "FOLLOW_UP":
        return "Follow-up"
      default:
        return purpose
    }
  }

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case "SCHEDULED":
        return "Scheduled"
      case "COMPLETED":
        return "Completed"
      case "CANCELLED":
        return "Cancelled"
      case "RESCHEDULED":
        return "Rescheduled"
      case "NO_SHOW":
        return "No Show"
      default:
        return status
    }
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "RESCHEDULED":
        return "bg-yellow-100 text-yellow-800"
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-md p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{appointment.purpose}</h4>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(appointment.date)}</span>
                      <Clock className="h-3 w-3 ml-3 mr-1" />
                      <span>{`${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedAppointment(appointment.id)}
                    >
                      <Edit2 className="h-3 w-3" />
                      <span className="sr-only">Edit appointment</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => {
                        // Delete appointment logic will go here
                        toast({
                          title: "Not implemented",
                          description: "Delete appointment functionality is not yet implemented",
                        })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="sr-only">Delete appointment</span>
                    </Button>
                  </div>
                </div>
                {appointment.notes && <p className="text-sm whitespace-pre-wrap mt-2">{appointment.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No appointments scheduled</p>
            <p className="text-sm">Add an appointment to keep track of meetings with this lead</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
