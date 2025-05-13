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
import { ChevronLeft, ChevronRight, CalendarIcon, AlertCircle, RefreshCw, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useGoogleCalendar } from "@/lib/hooks/useGoogleCalendar"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EventTooltip } from "@/components/event-tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AnimatePresence, motion } from "framer-motion"
import type { RawGCalEvent } from "@/types/appointments"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EventForm } from "@/components/event-form"

// Assuming AppointmentPurposeEnum is available or we define a similar mapping here
// For simplicity, let's define a basic color mapping here. 
// Ideally, this would come from a shared types/utils file or be passed in.
// This is a placeholder and might need adjustment based on your actual event data structure for 'purpose'
const AppointmentPurposeEnum = {
  INSPECTION: "INSPECTION",
  FILE_CLAIM: "FILE_CLAIM",
  FOLLOW_UP: "FOLLOW_UP",
  ADJUSTER: "ADJUSTER",
  BUILD_DAY: "BUILD_DAY",
  OTHER: "OTHER",
} as const;

type AppointmentPurpose = typeof AppointmentPurposeEnum[keyof typeof AppointmentPurposeEnum];

// Simplified color getter, adapt to your actual event structure and color preferences
const getEventColor = (event?: RawGCalEvent) => {
  const purpose = event?.extendedProperties?.private?.purpose as AppointmentPurpose | undefined;
  // Define your color mapping here
  const purposeColors: Record<AppointmentPurpose, string> = {
    [AppointmentPurposeEnum.INSPECTION]: "bg-blue-500 dark:bg-blue-400",
    [AppointmentPurposeEnum.FILE_CLAIM]: "bg-cyan-500 dark:bg-cyan-400",
    [AppointmentPurposeEnum.FOLLOW_UP]: "bg-amber-500 dark:bg-amber-400",
    [AppointmentPurposeEnum.ADJUSTER]: "bg-indigo-500 dark:bg-indigo-400",
    [AppointmentPurposeEnum.BUILD_DAY]: "bg-rose-500 dark:bg-rose-400",
    [AppointmentPurposeEnum.OTHER]: "bg-gray-500 dark:bg-gray-400"
  };
  return purposeColors[purpose as AppointmentPurpose] || "bg-gray-500 dark:bg-gray-400";
};

interface CalendarViewProps {
  credentials?: {
    accessToken: string;
    refreshToken?: string;
  };
  urlLeadId?: string;
  urlLeadName?: string;
  returnUrl?: string;
}

export function CalendarView({ credentials, urlLeadId, urlLeadName, returnUrl }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [direction, setDirection] = useState(0)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [detailedDayViewDate, setDetailedDayViewDate] = useState<Date | null>(null); // State for the day view
  const [selectedEvent, setSelectedEvent] = useState<RawGCalEvent | null>(null);

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
    setSelectedDate(date)
    setIsAppointmentModalOpen(true)
  }

  const handleAppointmentScheduled = () => {
    setIsAppointmentModalOpen(false)
    setSelectedDate(null)
    setSelectedTime(null)
    refetch() // Refresh the calendar to show the new appointment
    
    if (returnUrl) {
      window.location.href = returnUrl
    }
  }

  const handleEventClick = (event: RawGCalEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the day click handler from firing
    setDetailedDayViewDate(new Date(event.start?.dateTime || event.start?.date || ''));
    setSelectedEvent(event);
  };

  const renderDetailedDayView = () => {
    if (!detailedDayViewDate) return null;

    const dayEvents = eventsByDate[format(detailedDayViewDate, "yyyy-MM-dd")] || [];
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    // Helper to get appointments for a specific time slot within the detailed day view
    const getAppointmentsForTimeSlot = (hour: number) => {
      return dayEvents.filter((event: RawGCalEvent) => {
        if (!event.start) return false;
        const eventDateStr = event.start.date || event.start.dateTime;
        if (!eventDateStr) return false;

        const appointmentDate = new Date(eventDateStr);
        // Ensure it's for the correct day (already filtered by dayEvents for the most part)
        // but double check if dealing with multi-day events later.
        if (!isSameDay(appointmentDate, detailedDayViewDate)) return false; 

        const startHour = new Date(eventDateStr).getHours();
        return startHour === hour;
      });
    };

    return (
      <motion.div 
        className="p-2 sm:p-4 bg-background rounded-lg shadow overflow-hidden w-full"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between pb-2 mb-4 border-b">
          <h3 className="text-lg font-semibold">
            {format(detailedDayViewDate, "EEEE, MMMM d, yyyy")}
          </h3>
          <Button variant="outline" size="sm" onClick={() => {
            setDetailedDayViewDate(null);
            setSelectedEvent(null);
          }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Month
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-32">
             <motion.div
              className="rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </div>
        )}
        {!isLoading && error && (
           <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load calendar events for this day. {error.message}
            </AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && dayEvents.length === 0 && (
          <p className="text-gray-500 text-center py-4">No events scheduled for this day.</p>
        )}

        {!isLoading && !error && ( // Combined conditions for clarity
          <div className="space-y-2">
            {hours.map((hour) => {
              const timeSlotAppointments = getAppointmentsForTimeSlot(hour);
              const fullHourLabel = `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

              return (
                <div key={hour} className="flex items-start gap-4">
                  <div className="w-20 text-sm text-muted-foreground pt-2">{fullHourLabel}</div>
                  <div className="flex-1 min-h-[40px] pl-2 border-l border-border dark:border-gray-700">
                    {timeSlotAppointments.map((appointment: RawGCalEvent) => (
                      <div
                        key={appointment.id}
                        className={cn(
                          "text-sm px-2 py-1 rounded cursor-pointer mb-1 text-white shadow-sm",
                          getEventColor(appointment),
                        )}
                        onClick={(e) => handleEventClick(appointment, e)}
                      >
                        <div className="font-medium">{appointment.summary || "(No title)"}</div>
                        {appointment.start?.dateTime && (
                          <div className="text-xs opacity-90">
                            {format(new Date(appointment.start.dateTime), "h:mma")}
                            {appointment.end?.dateTime && ` - ${format(new Date(appointment.end.dateTime), "h:mma")}`}
                            {appointment.location && (
                              <div className="mt-1">📍 {appointment.location}</div>
                            )}
                          </div>
                        )}
                        {appointment.start?.date && !appointment.start?.dateTime && (
                          <div className="text-xs opacity-90">(All day)</div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add new event button */}
                    {urlLeadId && urlLeadName && (
                      <div
                        className="h-full w-full cursor-pointer hover:bg-muted/30 dark:hover:bg-slate-800/50 flex items-center justify-center text-muted-foreground/0 hover:text-primary transition-all duration-150 group rounded-md relative min-h-[40px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          const eventDateWithTime = new Date(detailedDayViewDate);
                          eventDateWithTime.setHours(hour, 0, 0, 0);
                          setSelectedDate(eventDateWithTime);
                          setIsAppointmentModalOpen(true);
                        }}
                        title={`Schedule new event at ${fullHourLabel}`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 text-xs font-medium transition-opacity duration-150 flex items-center">
                          <Plus className="h-3 w-3 mr-1" /> Schedule at {fullHourLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
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
          {calendarDays.map((day, index) => {
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

  // Main return: conditionally render day view or month view
  if (detailedDayViewDate) {
    return renderDetailedDayView();
  }

  return (
    <>
      <TooltipProvider>
        <div className="bg-background dark:bg-slate-900 rounded-lg shadow overflow-hidden w-full">
          <div className="p-2 sm:p-4 flex items-center justify-between border-b border-border dark:border-gray-700">
            <motion.h2
              className="text-xl font-semibold flex items-center text-slate-900 dark:text-slate-100"
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
          <div className="px-1 sm:px-4 py-2 text-xs text-muted-foreground dark:text-gray-400">{debugInfo}</div>

          {/* Calendar header with weekday names */}
          <div className="grid grid-cols-7 gap-px bg-border dark:bg-gray-700">
            {weekDays.map((day) => (
              <div key={day} className="bg-muted/50 dark:bg-gray-800 py-2 text-center text-sm font-medium text-foreground dark:text-slate-300">
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
              className="grid grid-cols-7 gap-px bg-border dark:bg-gray-600"
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
                      "relative min-h-[80px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2 border-r border-b",
                      isCurrentMonth ? "bg-background dark:bg-slate-900" : "bg-muted/30 dark:bg-slate-800",
                      isToday && "bg-sky-100 dark:bg-sky-700/50 ring-1 ring-sky-500",
                      !isCurrentMonth && "text-muted-foreground dark:text-gray-400",
                      "border-border dark:border-gray-700"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    onClick={() => setDetailedDayViewDate(day)}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm font-medium",
                          isToday ? "bg-primary text-primary-foreground" : (isCurrentMonth ? "text-foreground dark:text-slate-300" : "text-muted-foreground dark:text-gray-500"),
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {/* Update the events display to handle clicks */}
                      <div className="flex flex-wrap gap-1 mt-2 py-1 justify-start items-center">
                        {dayEvents.slice(0, 5).map((eventItem: RawGCalEvent, eventIndex: number) => (
                          <div
                            key={`${eventItem.id}-${eventIndex}`}
                            className={cn("w-2 h-2 rounded-full", getEventColor(eventItem))}
                            onClick={(e) => handleEventClick(eventItem, e)}
                            title={eventItem.summary || "Event"}
                          />
                        ))}
                        {dayEvents.length > 5 && (
                          <div className="w-2 h-2 rounded-full bg-muted dark:bg-gray-600 flex items-center justify-center text-[8px] text-secondary-foreground dark:text-gray-200" title={`${dayEvents.length - 5} more events`}>
                            {/* Could show +N here, or leave as a generic dot */}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Add new event button */}
                    {isCurrentMonth && urlLeadId && urlLeadName && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const eventDateWithTime = new Date(day);
                          setSelectedDate(eventDateWithTime);
                          setIsAppointmentModalOpen(true);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary dark:text-gray-400 dark:hover:text-primary-foreground transition-colors p-1 rounded-full hover:bg-muted dark:hover:bg-slate-700"
                        title="Add new event for this day"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </TooltipProvider>

      {/* Appointment Creation Modal */}
      {selectedDate && (
        <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
          <DialogContent className="sm:max-w-[400px] md:max-w-[550px] lg:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Event</DialogTitle>
            </DialogHeader>
            <EventForm
              key={selectedDate.toISOString() + (urlLeadId || '')}
              initialEventDate={selectedDate.toISOString()}
              initialLeadId={urlLeadId}
              initialLeadName={urlLeadName}
              onFormSubmit={handleAppointmentScheduled}
              onCancel={() => setIsAppointmentModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
