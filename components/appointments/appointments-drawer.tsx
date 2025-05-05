"use client"

import { DrawerClose } from "@/components/ui/drawer"
import { useState, useEffect } from "react"
import { Plus, X, CalendarPlus } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Calendar } from "./calendar"
import { AppointmentForm } from "./appointment-form"
import { toast } from "@/components/ui/use-toast"
import type { CalendarAppointment } from "@/types/appointments"
import type { AppointmentFormValues } from "@/lib/schemas/appointment-schema"
import { AppointmentPurposeEnum } from "@/types/appointments"
import { AppointmentStatus } from "@prisma/client"
import type { AppointmentPurpose } from "@/types/lead"

interface QuickAppointment {
  title: string
  purpose: AppointmentPurpose
  duration: number // Duration in minutes
  color: string
}

const quickAppointments: QuickAppointment[] = [
  {
    title: "Inspection",
    purpose: AppointmentPurposeEnum.INSPECTION,
    duration: 60,
    color: "bg-blue-500",
  },
  {
    title: "File Claim Assistance",
    purpose: AppointmentPurposeEnum.FILE_CLAIM,
    duration: 45,
    color: "bg-indigo-500",
  },
  {
    title: "Follow Up Call",
    purpose: AppointmentPurposeEnum.FOLLOW_UP,
    duration: 30,
    color: "bg-yellow-500",
  },
  {
    title: "Adjuster Meeting",
    purpose: AppointmentPurposeEnum.ADJUSTER,
    duration: 90,
    color: "bg-green-500",
  },
  {
    title: "Schedule Build Day",
    purpose: AppointmentPurposeEnum.BUILD_DAY,
    duration: 30,
    color: "bg-amber-500",
  },
  {
    title: "Other Appointment",
    purpose: AppointmentPurposeEnum.OTHER,
    duration: 60,
    color: "bg-gray-500",
  }
]

interface AppointmentsDrawerProps {
  isOpen: boolean
  onClose: () => void
  leadId?: string
  userId: string
}

type DrawerView = "calendar" | "form" | "details"

export function AppointmentsDrawer({ isOpen, onClose, leadId, userId }: AppointmentsDrawerProps) {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null)
  const [currentView, setCurrentView] = useState<DrawerView>("calendar")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedQuickAppointment, setSelectedQuickAppointment] = useState<QuickAppointment | null>(null)

  useEffect(() => {
    if (isOpen) {
      const fetchAppointments = async () => {
        setIsLoading(true)
        setError(null)
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          setAppointments([]);
        } catch (err) {
          console.error("Error fetching appointments:", err)
          setError(err instanceof Error ? err.message : "Failed to load appointments")
        } finally {
          setIsLoading(false)
        }
      }
      fetchAppointments()
    }
  }, [isOpen, userId, leadId])

  const handleDateClick = (date: Date, time?: string | null) => {
    setSelectedDate(date)
    setSelectedTime(time ?? null)
    console.log("Date clicked:", date, "Time:", time)
  }

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    setSelectedAppointment(appointment)
    console.log("Appointment clicked:", appointment)
    setIsFormOpen(true);
  }

  const handleAddAppointment = () => {
    setSelectedQuickAppointment(null)
    setSelectedAppointment(null)
    setIsFormOpen(true);
  }
  
  const handleFormSubmit = async (data: AppointmentFormValues) => {
    console.log("Submitting form data:", data)
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({ 
        title: selectedAppointment ? "Appointment updated" : "Appointment created",
        description: `${data.title} has been ${selectedAppointment ? 'updated' : 'scheduled'}.`
      });
      
      handleFormClose();

    } catch (error) {
      console.error("Error saving appointment:", error);
      toast({ 
        title: "Error", 
        description: `Failed to save appointment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }

  const handleCancelForm = () => {
    setIsFormOpen(false)
    setSelectedAppointment(null)
    setSelectedQuickAppointment(null)
  }

  const handleQuickAppointmentClick = (appt: QuickAppointment) => {
    setSelectedQuickAppointment(appt)
    setSelectedAppointment(null)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedQuickAppointment(null)
    setSelectedAppointment(null)
  }

  const getInitialFormValues = (): AppointmentFormValues => {
    const now = new Date()
    const startTime = new Date(now)
    startTime.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0)
    const endTime = new Date(startTime.getTime() + (selectedQuickAppointment?.duration || 60) * 60000)
    
    const defaultStatus: AppointmentStatus = AppointmentStatus.SCHEDULED;

    if (selectedAppointment) {
      return {
        title: selectedAppointment.title || "",
        leadId: selectedAppointment.leadId || leadId || "",
        userId: userId,
        date: selectedAppointment.date ? new Date(selectedAppointment.date) : now,
        startTime: selectedAppointment.startTime || "",
        endTime: selectedAppointment.endTime || "",
        purpose: selectedAppointment.purpose || AppointmentPurposeEnum.OTHER,
        status: selectedAppointment.status as AppointmentStatus || defaultStatus,
        address: selectedAppointment.address || "",
        notes: selectedAppointment.notes || "",
      }
    }
    
    return {
      title: selectedQuickAppointment?.title || "",
      leadId: leadId || "",
      userId: userId, 
      date: startTime,
      startTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      purpose: selectedQuickAppointment?.purpose || AppointmentPurposeEnum.OTHER,
      status: defaultStatus,
      address: "",
      notes: "",
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50">
          <CalendarPlus className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[99vh]">
        <DrawerHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DrawerTitle>
              {isFormOpen ? 
                (selectedAppointment ? "Edit Appointment" : "New Appointment") : 
                "Appointments"
              }
            </DrawerTitle>
            <div className="flex items-center gap-2">
              {isFormOpen && (
                <Button variant="ghost" size="sm" onClick={handleCancelForm}>
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
          {!isFormOpen ? (
            isLoading ? (
              <div className="flex items-center justify-center h-full"><p>Loading appointments...</p></div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-600"><p>Error: {error}</p></div>
            ) : (
              <Calendar 
                appointments={appointments}
                onDateClick={handleDateClick}
                onAppointmentClick={handleAppointmentClick}
                onSwitchToDay={(date, time) => {
                  setSelectedDate(date);
                  setSelectedTime(time ?? null);
                  handleAddAppointment();
                }}
              />
            )
          ) : (
            <div className="p-4 overflow-y-auto">
              <AppointmentForm 
                appointment={selectedAppointment || undefined}
                initialDate={selectedDate || undefined}
                initialTime={selectedTime}
                defaultValues={getInitialFormValues()}
                onCancel={handleCancelForm}
                onSubmit={handleFormSubmit}
              />
            </div>
          )}
          
          {!isFormOpen && (
             <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t">
                {quickAppointments.map((appt) => (
                  <Button
                    key={appt.purpose}
                    variant="outline"
                    className={`h-20 flex flex-col justify-center items-center p-2 text-center ${appt.color} text-white hover:opacity-90`}
                    onClick={() => handleQuickAppointmentClick(appt)}
                  >
                    <span className="text-sm font-medium">{appt.title}</span>
                    <span className="text-xs">({appt.duration} min)</span>
                  </Button>
                ))}
                <Button
                  variant="secondary"
                  className="h-20 flex flex-col justify-center items-center p-2 text-center col-span-2 sm:col-span-1"
                  onClick={handleAddAppointment}
                >
                  <span className="text-sm font-medium">Custom Appointment</span>
                </Button>
              </div>
          )}
          
          {currentView === "details" && selectedAppointment && (
            <div className="p-4 overflow-y-auto border-t">
              <h3 className="font-semibold mb-2">{selectedAppointment.title}</h3>
              <p>Date: {selectedAppointment.date?.toLocaleDateString()}</p>
              <p>Time: {selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
              <p>Purpose: {selectedAppointment.purpose}</p>
              <p>Status: {selectedAppointment.status}</p>
              <p>Lead: {selectedAppointment.leadName}</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
