"use client"

import { Calendar } from "@/components/appointments/calendar"
import type { CalendarAppointment } from "@/types/appointments"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  const handleDateClick = (date: Date) => {
    console.log("Date clicked:", date)
  }

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    toast({
      title: appointment.title,
      description: `${appointment.startTime} - ${appointment.endTime}${appointment.address ? ` at ${appointment.address}` : ""}`,
    })
  }

  const handleSwitchToDay = (date: Date, time?: string) => {
    toast({
      title: "Create Appointment",
      description: `Creating appointment for ${date.toLocaleDateString()}${time ? ` at ${time}` : ""}`,
    })
  }

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Show sign in message if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please sign in to access the calendar.
          </p>
        </div>
      </div>
    )
  }

  // Get Google Calendar credentials from session
  const credentials = {
    accessToken: session?.accessToken as string,
    refreshToken: session?.refreshToken as string,
  }

  return (
    <div className="h-screen p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full">
        <Calendar
          credentials={credentials}
          onDateClick={handleDateClick}
          onAppointmentClick={handleAppointmentClick}
          onSwitchToDay={handleSwitchToDay}
        />
      </div>
    </div>
  )
} 