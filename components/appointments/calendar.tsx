"use client"

import React from "react"

import { useState, useMemo, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { AppointmentPurposeEnum, type AppointmentPurpose } from '@/types/appointments'
import type { CalendarAppointment } from "@/types/appointments"
import { useGoogleCalendar } from "@/lib/hooks/useGoogleCalendar"

type CalendarView = "month" | "week" | "day"

interface CalendarProps {
  credentials: {
    accessToken: string;
    refreshToken?: string;
  };
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  onSwitchToDay: (date: Date, time?: string) => void;
}

export function Calendar({ credentials, onDateClick, onAppointmentClick, onSwitchToDay }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [zoomingDay, setZoomingDay] = useState<Date | null>(null)
  const calendarContentRef = useRef<HTMLDivElement>(null)

  // Use our new Google Calendar hook
  const {
    appointments,
    isLoading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useGoogleCalendar({
    view,
    currentDate,
    credentials,
  });

  // Add this useEffect to inject the CSS animation
  useEffect(() => {
    // Add the CSS animation to the document
    const style = document.createElement("style")
    style.textContent = `
      .calendar-content {
        position: relative;
        overflow: auto !important;
      }
      
      .zoom-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0);
        pointer-events: none;
        z-index: 50;
        transition: background-color 500ms ease-in-out;
      }
      
      .zoom-overlay.active {
        background-color: rgba(255, 255, 255, 0.8);
      }
      
      .day-cell {
        transition: all 500ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .day-cell.zooming {
        z-index: 60;
        position: fixed;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }

      .google-calendar-button {
        background-color: #f8f8f8;
        border-radius: 0.5rem;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 300ms ease;
        border: 1px solid #e2e8f0;
      }

      .google-calendar-button:hover {
        background-color: #f1f1f1;
        transform: scale(1.05);
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Month view helpers
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Week view helpers
  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((appointment: CalendarAppointment) => appointment.date && isSameDay(new Date(appointment.date), day))
  }

  // Get appointments for a specific time slot
  const getAppointmentsForTimeSlot = (day: Date, hour: number) => {
    return appointments.filter((appointment: CalendarAppointment) => {
      if (!appointment.date || !appointment.startTime) return false

      const appointmentDate = new Date(appointment.date)
      if (!isSameDay(appointmentDate, day)) return false

      const [startHour] = appointment.startTime.split(":").map(Number)
      return startHour === hour
    })
  }

  // Get color for appointment purpose
  const getAppointmentColor = (purpose?: AppointmentPurpose) => {
    if (!purpose) return "bg-gray-500 dark:bg-gray-400";

    const purposeColors: Record<AppointmentPurpose, string> = {
      [AppointmentPurposeEnum.INSPECTION]: "bg-blue-500 dark:bg-blue-400",
      [AppointmentPurposeEnum.FILE_CLAIM]: "bg-cyan-500 dark:bg-cyan-400",
      [AppointmentPurposeEnum.FOLLOW_UP]: "bg-amber-500 dark:bg-amber-400",
      [AppointmentPurposeEnum.ADJUSTER]: "bg-indigo-500 dark:bg-indigo-400",
      [AppointmentPurposeEnum.BUILD_DAY]: "bg-rose-500 dark:bg-rose-400",
      [AppointmentPurposeEnum.OTHER]: "bg-gray-500 dark:bg-gray-400"
    };

    return purposeColors[purpose] || "bg-gray-500 dark:bg-gray-400";
  }

  // Navigation handlers
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1))
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Navigation based on current view
  const goToPrevious = () => {
    if (view === "month") goToPreviousMonth()
    else if (view === "week") goToPreviousWeek()
    else goToPreviousDay()
  }

  const goToNext = () => {
    if (view === "month") goToNextMonth()
    else if (view === "week") goToNextWeek()
    else goToNextDay()
  }

  // Format the header based on current view
  const formatHeader = () => {
    if (view === "month") return format(currentDate, "MMMM yyyy")
    else if (view === "week") return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
    else return format(currentDate, "EEEE, MMMM d, yyyy")
  }

  // Legend items for appointment types
  const legendItems = useMemo(() => {
    // Use AppointmentPurposeEnum values
    const purposeColors: Record<string, string> = { // Corrected type annotation
      [AppointmentPurposeEnum.INSPECTION]: "bg-blue-500 dark:bg-blue-400",
      [AppointmentPurposeEnum.FILE_CLAIM]: "bg-cyan-500 dark:bg-cyan-400",
      [AppointmentPurposeEnum.FOLLOW_UP]: "bg-amber-500 dark:bg-amber-400",
      [AppointmentPurposeEnum.ADJUSTER]: "bg-indigo-500 dark:bg-indigo-400",
      [AppointmentPurposeEnum.BUILD_DAY]: "bg-rose-500 dark:bg-rose-400",
      [AppointmentPurposeEnum.OTHER]: "bg-gray-500 dark:bg-gray-400"
    }

    // Use PURPOSE_LABELS from types/appointments if available, otherwise format enum keys
    const purposeLabels = {
      [AppointmentPurposeEnum.INSPECTION]: "Inspection",
      [AppointmentPurposeEnum.FILE_CLAIM]: "File Claim",
      [AppointmentPurposeEnum.FOLLOW_UP]: "Follow Up",
      [AppointmentPurposeEnum.ADJUSTER]: "Adjuster Meeting",
      [AppointmentPurposeEnum.BUILD_DAY]: "Build Day",
      [AppointmentPurposeEnum.OTHER]: "Other"
    };


    return Object.entries(purposeColors).map(([purposeKey, color]) => ({
      // Use the label if found, otherwise format the enum key
      purpose: purposeLabels[purposeKey as keyof typeof purposeLabels] || purposeKey.replace(/_/g, " ").toLowerCase(),
      color,
    }))
  }, [])

  // Handle day click with enhanced zoom animation centered on screen
  const handleDayClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    // Set the clicked day as the current date
    setCurrentDate(day)
    setZoomingDay(day)

    // Get the clicked element
    const dayElement = e.currentTarget
    const rect = dayElement.getBoundingClientRect()

    // Calculate the center of the viewport
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = window.innerHeight / 2

    // Calculate the center of the day cell
    const dayCellCenterX = rect.left + rect.width / 2
    const dayCellCenterY = rect.top + rect.height / 2

    // Calculate the translation needed to center the day cell in the viewport
    const translateX = viewportCenterX - dayCellCenterX
    const translateY = viewportCenterY - dayCellCenterY

    // Create overlay for fade effect
    const overlay = document.createElement("div")
    overlay.className = "zoom-overlay"
    document.body.appendChild(overlay)

    // Force a reflow to ensure the overlay is added before adding the active class
    overlay.offsetHeight
    overlay.classList.add("active")

    // Store original position and dimensions
    const originalTop = rect.top
    const originalLeft = rect.left
    const originalWidth = rect.width
    const originalHeight = rect.height

    // Add zooming class to the clicked day element
    dayElement.classList.add("zooming")

    // Set the element's position to fixed at its current position
    dayElement.style.top = `${originalTop}px`
    dayElement.style.left = `${originalLeft}px`
    dayElement.style.width = `${originalWidth}px`
    dayElement.style.height = `${originalHeight}px`
    dayElement.style.transformOrigin = "center center"

    // Start the zoom animation with translation to center of viewport
    setTimeout(() => {
      dayElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(5)`
      dayElement.style.opacity = "0.9"
    }, 10)

    // After animation completes, switch to day view
    setTimeout(() => {
      setView("day")
      setZoomingDay(null)

      // Remove animation classes and styles
      dayElement.classList.remove("zooming")
      dayElement.style.transform = ""
      dayElement.style.top = ""
      dayElement.style.left = ""
      dayElement.style.width = ""
      dayElement.style.height = ""
      dayElement.style.transformOrigin = ""
      dayElement.style.opacity = ""

      // Remove the overlay
      overlay.classList.remove("active")
      setTimeout(() => {
        document.body.removeChild(overlay)
      }, 300)
    }, 500) // Match this with the CSS animation duration
  }

  // Replace the toggleGoogleCalendar function with this:
  const openGoogleCalendar = () => {
    window.open("https://calendar.google.com/calendar/u/2/r/month", "_blank")
  }

  // Month view
  const renderMonthView = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">Error loading calendar: {error.message}</div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Calendar header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {monthDays.map((day, i) => {
            const dayAppointments = getAppointmentsForDay(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isZooming = zoomingDay && isSameDay(day, zoomingDay)

            return (
              <ContextMenu key={day.toString()}>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      "day-cell min-h-[80px] p-1 border border-gray-200 dark:border-gray-800 rounded-md",
                      isCurrentMonth
                        ? "bg-white dark:bg-gray-950"
                        : "bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600",
                      isToday && "ring-2 ring-blue-500 dark:ring-blue-400",
                      isZooming && "zooming",
                    )}
                    onClick={(e) => handleDayClick(day, e)}
                  >
                    <div className="text-right text-xs font-medium mb-1">{format(day, "d")}</div>

                    {/* Appointment dots instead of text */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dayAppointments.slice(0, 5).map((appointment: CalendarAppointment) => (
                        <div
                          key={appointment.id}
                          className={cn("w-2 h-2 rounded-full", getAppointmentColor(appointment.purpose))}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppointmentClick(appointment)
                          }}
                        />
                      ))}
                      {dayAppointments.length > 5 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          +{dayAppointments.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => onSwitchToDay(day)}>Add Appointment</ContextMenuItem>
                  <ContextMenuItem onClick={() => onDateClick(day)}>View Details</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )
          })}
        </div>
      </div>
    )
  }

  // Week view
  const renderWeekView = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">Error loading calendar: {error.message}</div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM

    return (
      <div className="flex flex-col h-full">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 border-b border-gray-200 dark:border-gray-700">
          <div className="py-2"></div> {/* Empty cell for time column */}
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className={cn("py-2 font-medium", isSameDay(day, new Date()) && "text-blue-600 dark:text-blue-400")}
            >
              <div>{format(day, "EEE")}</div>
              <div className="text-lg">{format(day, "d")}</div>
            </div>
          ))}
        </div>

        {/* Week grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                {/* Time column */}
                <div className="py-2 text-xs text-right pr-2 text-gray-500 dark:text-gray-400">
                  {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 ? "AM" : "PM"}
                </div>

                {/* Day columns */}
                {weekDays.map((day) => {
                  const timeSlotAppointments = getAppointmentsForTimeSlot(day, hour)

                  return (
                    <div
                      key={day.toString()}
                      className="border border-gray-200 dark:border-gray-800 h-16 p-1"
                      onClick={() => {
                        const selectedDate = new Date(day)
                        selectedDate.setHours(hour)
                        // Convert hour to formatted time string (e.g., "9:00 AM")
                        const period = hour >= 12 ? "PM" : "AM"
                        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                        const formattedTime = `${displayHour}:00 ${period}`
                        onSwitchToDay(selectedDate, formattedTime)
                      }}
                    >
                      {timeSlotAppointments.map((appointment: CalendarAppointment) => (
                        <div
                          key={appointment.id}
                          className={cn(
                            "text-xs px-1 py-0.5 rounded truncate cursor-pointer mb-1 text-white",
                            getAppointmentColor(appointment.purpose),
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppointmentClick(appointment)
                          }}
                        >
                          {appointment.title}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Day view
  const renderDayView = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">Error loading calendar: {error.message}</div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    const hours = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM

    return (
      <div className="flex flex-col h-full">
        {/* Day header */}
        <div className="text-center py-2 font-medium border-b border-gray-200 dark:border-gray-700">
          {format(currentDate, "EEEE, MMMM d, yyyy")}
        </div>

        {/* Day schedule */}
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => {
            const timeSlotAppointments = getAppointmentsForTimeSlot(currentDate, hour)

            return (
              <div key={hour} className="flex border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 py-2 text-xs text-right pr-2 text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 ? "AM" : "PM"}
                </div>
                <div
                  className="flex-1 min-h-[60px] p-1 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer"
                  onClick={() => {
                    const selectedDate = new Date(currentDate)
                    selectedDate.setHours(hour)
                    // Convert hour to formatted time string (e.g., "9:00 AM")
                    const period = hour >= 12 ? "PM" : "AM"
                    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
                    const formattedTime = `${displayHour}:00 ${period}`
                    onSwitchToDay(selectedDate, formattedTime)
                  }}
                >
                  {timeSlotAppointments.map((appointment: CalendarAppointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "text-sm px-2 py-1 rounded cursor-pointer mb-1 text-white",
                        getAppointmentColor(appointment.purpose),
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(appointment)
                      }}
                    >
                      <div className="font-medium">{appointment.title}</div>
                      <div className="text-xs">
                        {appointment.startTime} - {appointment.endTime || "TBD"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Calendar controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[150px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatHeader()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarPicker
                mode="single"
                selected={currentDate}
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    setCurrentDate(date)
                    setCalendarOpen(false)
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* View selection */}
        <div className="flex items-center space-x-4">
          {/* Replace the existing Google Calendar button with this */}
          <a
            href="https://calendar.google.com/calendar/u/2/r/month"
            target="_blank"
            rel="noopener noreferrer"
            className="google-calendar-button"
            title="Open Google Calendar"
          >
            <img src="/images/google-calendar-icon.png" alt="Google Calendar" className="w-12 h-12" />
          </a>

          <div className="w-auto">
            <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div ref={calendarContentRef} className="flex-1 overflow-y-auto p-4 calendar-content">
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </div>

      {/* Appointment legend */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {legendItems.map(({ purpose, color }) => (
            <div key={purpose} className="flex items-center">
              <div className={cn("w-3 h-3 rounded-full mr-1", color)} />
              <span className="text-xs capitalize">{purpose}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
