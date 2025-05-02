"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow, isPast, parseISO } from "date-fns"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppointmentCountdownProps {
  appointmentDate: Date | string | null
  appointmentTime: string | null
  className?: string
}

export function AppointmentCountdown({ appointmentDate, appointmentTime, className }: AppointmentCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [isPastAppointment, setIsPastAppointment] = useState(false)

  useEffect(() => {
    if (!appointmentDate || !appointmentTime) return

    // Parse the appointment date and time
    const date = typeof appointmentDate === "string" ? parseISO(appointmentDate) : appointmentDate

    // Extract hours and minutes from time string (e.g., "10:00 AM")
    const timeMatch = appointmentTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!date || !timeMatch) return

    let hours = Number.parseInt(timeMatch[1])
    const minutes = Number.parseInt(timeMatch[2])
    const period = timeMatch[3].toUpperCase()

    // Convert to 24-hour format
    if (period === "PM" && hours < 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0

    // Create a new date with the correct time
    const appointmentDateTime = new Date(date)
    appointmentDateTime.setHours(hours, minutes, 0, 0)

    // Check if the appointment is in the past
    const isPastDate = isPast(appointmentDateTime)
    setIsPastAppointment(isPastDate)

    if (isPastDate) {
      setTimeRemaining("Appointment has passed")
      return
    }

    // Update the time remaining
    const updateTimeRemaining = () => {
      const now = new Date()
      if (now >= appointmentDateTime) {
        setTimeRemaining("Appointment has passed")
        setIsPastAppointment(true)
        return
      }

      const timeLeft = formatDistanceToNow(appointmentDateTime, { addSuffix: false })
      setTimeRemaining(timeLeft)
    }

    // Update immediately and then every minute
    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000)

    return () => clearInterval(interval)
  }, [appointmentDate, appointmentTime])

  if (!timeRemaining || isPastAppointment) return null

  // Determine color based on time remaining
  let colorClass = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"

  if (timeRemaining.includes("hour") && !timeRemaining.includes("day")) {
    colorClass = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100" // Less than a day
  } else if (timeRemaining.includes("day")) {
    const days = Number.parseInt(timeRemaining.split(" ")[0])
    if (days <= 3) {
      colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100" // 1-3 days
    }
  }

  return (
    <div
      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", colorClass, className)}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{`Adjuster in ${timeRemaining}`}</span>
    </div>
  )
}
