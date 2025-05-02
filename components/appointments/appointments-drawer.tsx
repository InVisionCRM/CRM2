"use client"

import { DrawerClose } from "@/components/ui/drawer"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Calendar } from "./calendar" // Updated import
import { AppointmentForm } from "./appointment-form"
import { toast } from "@/components/ui/use-toast"
import type { CalendarAppointment } from "@/types/appointments"
import type { AppointmentFormValues } from "@/lib/schemas/appointment-schema"

// Mock data for demonstration
const mockAppointments: CalendarAppointment[] = [
  {
    id: "1",
    title: "Initial Roof Assessment",
    date: new Date(2023, 6, 25, 10, 30),
    startTime: "10:30 AM",
    endTime: "11:30 AM",
    purpose: "initial_assessment",
    status: "scheduled",
    clientId: "1",
    clientName: "John Smith",
    address: "123 Main St, Anytown",
    notes: "Check for hail damage on north side of roof",
  },
  {
    id: "2",
    title: "Measurement",
    date: new Date(2023, 6, 25, 14, 0),
    startTime: "2:00 PM",
    endTime: "3:00 PM",
    purpose: "measurement",
    status: "scheduled",
    clientId: "2",
    clientName: "Sarah Johnson",
    address: "456 Oak Ave, Somewhere",
  },
  {
    id: "3",
    title: "Proposal Presentation",
    date: new Date(2023, 6, 26, 9, 0),
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    purpose: "proposal_presentation",
    status: "scheduled",
    clientId: "3",
    clientName: "Michael Brown",
    address: "789 Pine Rd, Elsewhere",
  },
  {
    id: "4",
    title: "Contract Signing",
    date: new Date(2023, 6, 27, 15, 0),
    startTime: "3:00 PM",
    endTime: "4:00 PM",
    purpose: "contract_signing",
    status: "scheduled",
    clientId: "1",
    clientName: "John Smith",
    address: "123 Main St, Anytown",
  },
  {
    id: "5",
    title: "Follow-up Visit",
    date: new Date(2023, 6, 28, 11, 0),
    startTime: "11:00 AM",
    endTime: "12:00 PM",
    purpose: "follow_up",
    status: "scheduled",
    clientId: "2",
    clientName: "Sarah Johnson",
    address: "456 Oak Ave, Somewhere",
  },
  {
    id: "6",
    title: "Installation",
    date: new Date(2023, 6, 29, 8, 0),
    startTime: "8:00 AM",
    endTime: "5:00 PM",
    purpose: "build day",
    status: "scheduled",
    clientId: "3",
    clientName: "Michael Brown",
    address: "789 Pine Rd, Elsewhere",
  },
  {
    id: "7",
    title: "Final Inspection",
    date: new Date(2023, 6, 30, 14, 0),
    startTime: "2:00 PM",
    endTime: "3:00 PM",
    purpose: "inspection",
    status: "scheduled",
    clientId: "1",
    clientName: "John Smith",
    address: "123 Main St, Anytown",
  },
  // Add more appointments for the current month to demonstrate stacking
  {
    id: "8",
    title: "Initial Assessment",
    date: new Date(2023, 6, 25, 13, 0),
    startTime: "1:00 PM",
    endTime: "2:00 PM",
    purpose: "initial_assessment",
    status: "scheduled",
    clientId: "4",
    clientName: "Emily Davis",
    address: "101 Cedar Ln, Nowhere",
  },
  {
    id: "9",
    title: "Measurement",
    date: new Date(2023, 6, 25, 16, 0),
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    purpose: "measurement",
    status: "scheduled",
    clientId: "5",
    clientName: "Robert Wilson",
    address: "202 Maple Dr, Anywhere",
  },
  {
    id: "10",
    title: "Follow-up",
    date: new Date(2023, 6, 25, 17, 30),
    startTime: "5:30 PM",
    endTime: "6:30 PM",
    purpose: "follow_up",
    status: "scheduled",
    clientId: "6",
    clientName: "Jennifer Taylor",
    address: "303 Elm St, Somewhere",
  },
  {
    id: "11",
    title: "Contract Signing",
    date: new Date(2023, 6, 25, 9, 0),
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    purpose: "contract_signing",
    status: "scheduled",
    clientId: "7",
    clientName: "David Anderson",
    address: "404 Birch Rd, Anywhere",
  },
  {
    id: "12",
    title: "Installation",
    date: new Date(2023, 6, 25, 8, 0),
    startTime: "8:00 AM",
    endTime: "5:00 PM",
    purpose: "installation",
    status: "scheduled",
    clientId: "8",
    clientName: "Lisa Martinez",
    address: "505 Pine Ave, Nowhere",
  },
]

interface AppointmentsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

type DrawerView = "calendar" | "form" | "details"

export function AppointmentsDrawer({ isOpen, onClose }: AppointmentsDrawerProps) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(mockAppointments)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  const [currentView, setCurrentView] = useState<DrawerView>("calendar")

  const handleDateClick = (date: Date, time?: string) => {
    setSelectedDate(date)
    setSelectedTime(time) // We'll add this state variable
    console.log("Date clicked:", date, "Time:", time)
  }

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment)
    console.log("Appointment clicked:", appointment)
  }

  const handleAddAppointment = (date?: Date, time?: string) => {
    if (date) {
      setSelectedDate(date)
    }
    if (time) {
      setSelectedTime(time)
    }
    setSelectedAppointment(null)
    setCurrentView("form")
  }

  const handleFormSubmit = (data: AppointmentFormValues) => {
    // In a real app, this would save to the database
    if (selectedAppointment) {
      // Update existing appointment
      const updatedAppointments = appointments.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? {
              ...appointment,
              ...data,
              clientName:
                data.clientId === appointment.clientId
                  ? appointment.clientName
                  : mockAppointments.find((a) => a.clientId === data.clientId)?.clientName || "Unknown",
            }
          : appointment,
      )
      setAppointments(updatedAppointments)
      toast({
        title: "Appointment updated",
        description: `${data.title} has been updated.`,
      })
    } else {
      // Create new appointment
      const newAppointment: CalendarAppointment = {
        id: `new-${Date.now()}`,
        ...data,
        clientName: mockAppointments.find((a) => a.clientId === data.clientId)?.clientName || "Unknown",
      }
      setAppointments([...appointments, newAppointment])
      toast({
        title: "Appointment created",
        description: `${data.title} has been scheduled.`,
      })
    }
    setCurrentView("calendar")
  }

  const handleCancelForm = () => {
    setCurrentView("calendar")
    setSelectedAppointment(null)
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[99vh]">
        <DrawerHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DrawerTitle>
              {currentView === "calendar" && "Appointments"}
              {currentView === "form" && (selectedAppointment ? "Edit Appointment" : "New Appointment")}
              {currentView === "details" && "Appointment Details"}
            </DrawerTitle>
            <div className="flex items-center gap-2">
              {currentView !== "calendar" && (
                <Button variant="ghost" size="sm" onClick={() => setCurrentView("calendar")}>
                  Back
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 flex flex-col h-[70vh]">
          {currentView === "calendar" && (
            <Calendar // Updated component name
              appointments={appointments}
              onDateClick={handleDateClick}
              onAppointmentClick={handleAppointmentClick}
              onSwitchToDay={(date, time) => {
                // When coming from context menu's "Add Appointment", open the form
                handleAddAppointment(date, time)
              }}
            />
          )}

          {currentView === "form" && (
            <div className="p-4 overflow-y-auto">
              <AppointmentForm
                initialDate={selectedDate}
                initialTime={selectedTime}
                appointment={selectedAppointment || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
              />
            </div>
          )}
        </div>

        {/* Floating Action Button for adding new appointment */}
        {currentView === "calendar" && (
          <div className="absolute bottom-4 right-4">
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg" onClick={handleAddAppointment}>
              <Plus className="h-6 w-6" />
              <span className="sr-only">Add appointment</span>
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
