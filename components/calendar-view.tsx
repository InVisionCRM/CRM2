"use client"

import { useState, useMemo, useEffect } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isValid,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { ChevronLeft, ChevronRight, CalendarIcon, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useGoogleCalendar } from "@/lib/hooks/useGoogleCalendar"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EventTooltip } from "@/components/event-tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AnimatePresence, motion } from "framer-motion"
import type { RawGCalEvent } from "@/types/appointments"

interface CalendarViewProps {
  credentials?: {
    accessToken: string;
    refreshToken?: string;
  };
  leadId?: string;
  leadName?: string;
  returnUrl?: string;
}

export function CalendarView({ credentials, leadId, leadName, returnUrl }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [direction, setDirection] = useState(0)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const { 
    appointments,
    isLoading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch 
  } = useGoogleCalendar({ 
    view: "month", // Or manage view state within this component
    currentDate: currentMonth, // Use the stateful currentMonth
    credentials 
  });

  useEffect(() => {
    // Debug information
    setDebugInfo(`Found ${appointments.length} events for ${format(currentMonth, "MMMM yyyy")}`)
    console.log("Calendar events:", appointments)
  }, [appointments, currentMonth])

  // Generate calendar days including days from previous and next months to fill the grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  // Get day names for the header
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Group events by date for easier lookup
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, RawGCalEvent[]> = {}

    appointments.forEach((event) => {
      try {
        // Determine the event date (either start date for all-day events or start time for timed events)
        let eventDate: Date | null = null

        if (event.start?.date) {
          eventDate = new Date(event.start.date)
        } else if (event.start?.dateTime) {
          eventDate = new Date(event.start.dateTime)
        }

        if (eventDate && isValid(eventDate)) {
          const dateKey = format(eventDate, "yyyy-MM-dd")

          if (!grouped[dateKey]) {
            grouped[dateKey] = []
          }

          grouped[dateKey].push(event)
        }
      } catch (error) {
        console.error("Error processing event:", event, error)
      }
    })

    return grouped
  }, [appointments])

  const previousMonth = () => {
    setDirection(-1)
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setDirection(1)
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleRetry = () => {
    refetch()
  }

  const handleDateClick = (date: Date) => {
    if (leadId && leadName) {
      setSelectedDate(date);
      setIsAppointmentModalOpen(true);
    }
  };

  const handleAppointmentScheduled = () => {
    setIsAppointmentModalOpen(false);
    setSelectedDate(null);
    setSelectedTime(null);
    
    // Navigate back to lead detail page if returnUrl is provided
    if (returnUrl) {
      window.location.href = returnUrl;
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const transition = {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 },
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <motion.div
          className="rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.p
          className="mt-2 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Loading your calendar...
        </motion.p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load calendar events. {error.message}
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Show calendar grid even on error */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {calendarDays.map((day) => {
            const isToday = isSameDay(day, new Date())

            return (
              <div
                key={day.toString()}
                className={cn(
                  "min-h-[100px] md:min-h-[120px] bg-white p-2",
                  !isSameMonth(day, currentMonth) && "bg-gray-50 text-gray-400",
                )}
              >
                <div className="flex justify-between">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                      isToday && "bg-primary text-white font-semibold",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {isSameMonth(day, currentMonth) && (
                    <Link
                      href={`/dashboard/events/new?date=${format(day, "yyyy-MM-dd")}`}
                      className="text-xs text-gray-500 hover:text-primary transition-colors"
                    >
                      +
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <TooltipProvider>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b">
            <motion.h2
              className="text-xl font-semibold flex items-center"
              key={format(currentMonth, "MMMM-yyyy")}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CalendarIcon className="mr-2 h-5 w-5" />
              {format(currentMonth, "MMMM yyyy")}
            </motion.h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRetry}
                title="Refresh calendar"
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Debug info */}
          <div className="px-4 py-2 text-xs text-gray-500">{debugInfo}</div>

          {/* Calendar header with weekday names */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {weekDays.map((day) => (
              <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid with animation */}
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={format(currentMonth, "yyyy-MM")}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="grid grid-cols-7 gap-px bg-gray-200"
            >
              {calendarDays.map((day, index) => {
                const dateKey = format(day, "yyyy-MM-dd")
                const dayEvents = eventsByDate[dateKey] || []
                const isToday = isSameDay(day, new Date())
                const isCurrentMonth = isSameMonth(day, currentMonth)

                return (
                  <motion.div
                    key={day.toString()}
                    className={cn(
                      "relative min-h-[100px] md:min-h-[120px] bg-white p-2 border-r border-b border-gray-200 dark:border-gray-700",
                      !isCurrentMonth && "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                      isToday && "bg-sky-50 dark:bg-sky-900/30"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                          isToday ? "bg-primary text-primary-foreground" : "text-gray-900 dark:text-gray-100",
                          !isCurrentMonth && "text-gray-400 dark:text-gray-500"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {isCurrentMonth && (
                        <Link
                          href={`/dashboard/events/new?date=${format(day, "yyyy-MM-dd")}`}
                          className="text-xs text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Add new event"
                        >
                          +
                        </Link>
                      )}
                    </div>
                    {/* Render events for this day */}
                    <div className="mt-1 space-y-1">
                      {dayEvents.map((eventItem: RawGCalEvent, eventIndex: number) => {
                        const eventTime = eventItem.start?.dateTime
                        if (eventTime) {
                          return (
                            <EventTooltip key={eventIndex} event={eventItem}>
                              <motion.div
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + eventIndex * 0.05 }}
                              >
                                <Link
                                  href={`/dashboard/events/${eventItem.id}/edit`}
                                  className="block text-xs p-1 rounded truncate hover:bg-gray-100 transition-all duration-200 hover:shadow-sm"
                                >
                                  <span className="font-medium">
                                    {format(new Date(eventTime), "h:mm a")}
                                  </span>
                                  {eventItem.start?.date && !eventItem.start?.dateTime && (
                                    <span className="inline-block w-2 h-2 mr-1 rounded-full bg-primary" />
                                  )}
                                  <span
                                    className={cn(
                                      "ml-1",
                                      eventItem.start?.date && !eventItem.start?.dateTime ? "text-primary" : "",
                                    )}
                                  >
                                    {eventItem.summary || "Untitled Event"}
                                  </span>
                                </Link>
                              </motion.div>
                            </EventTooltip>
                          )
                        }
                        return null
                      })}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </>
  )
}
