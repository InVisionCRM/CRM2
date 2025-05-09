"use client"

import { useState } from "react"
import { Calendar } from "@/components/appointments/calendar"
import type { CalendarAppointment } from "@/types/appointments"
import { useSession, signIn } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { GOOGLE_CALENDAR_CONFIG } from "@/lib/config/google-calendar"

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)

  // Get Google Calendar credentials from session
  const credentials = {
    accessToken: session?.accessToken as string,
    refreshToken: session?.refreshToken as string,
  }

  const handleConnectCalendar = async () => {
    try {
      setIsConnecting(true)
      // Use the current URL as the callbackUrl to return to this page
      const callbackUrl = window.location.href
      await signIn("google", {
        callbackUrl,
        scope: GOOGLE_CALENDAR_CONFIG.API_SCOPES.join(" ")
      })
    } catch (error) {
      console.error("Failed to connect to Google Calendar:", error)
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      })
      setIsConnecting(false)
    }
  }

  const handleDateClick = (date: Date) => {
    // Handle date click - could show a modal with more details
    console.log("Date clicked:", date)
  }

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    // Handle appointment click - could show a modal with appointment details
    toast({
      title: appointment.title,
      description: `${appointment.startTime} - ${appointment.endTime}${appointment.address ? ` at ${appointment.address}` : ""}`,
    })
  }

  const handleSwitchToDay = (date: Date, time?: string) => {
    // Handle switching to day view - could show appointment creation modal
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

  if (!session?.accessToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Google Calendar Access Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please connect your Google Calendar to use this feature.
          </p>
          <button
            className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center gap-2 ${
              isConnecting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            onClick={handleConnectCalendar}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Connecting...
              </>
            ) : (
              'Connect Google Calendar'
            )}
          </button>
        </div>
      </div>
    )
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