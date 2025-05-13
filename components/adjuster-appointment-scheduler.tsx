"use client"

import { useState, useEffect } from "react"
import { format, addDays, isBefore, startOfToday } from "date-fns"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Trash2, CalendarDays, ClipboardList, AlertCircle, CheckCircle, MapPin } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { scheduleAdjusterAppointmentAction } from "@/app/actions/lead-actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { CustomDatePicker } from "@/components/custom-date-picker"

// Generate time slots from 8:00 AM to 7:30 PM in 30-minute increments
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = (i % 2) * 30
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return {
    value: `${displayHour}:${minute === 0 ? "00" : minute} ${period}`,
    display: `${displayHour}:${minute === 0 ? "00" : minute} ${period}`,
  }
}).filter((slot) => {
  const [time, period] = slot.display.split(" ")
  const [hour, minute] = time.split(":").map(Number)
  if (period === "PM" && hour === 7 && minute > 30) return false
  if (period === "PM" && hour > 7) return false
  return true
})

interface AdjusterAppointmentSchedulerProps {
  leadId: string
  clientId?: string
  address?: string
  leadName?: string
  appointmentId?: string
  initialDate: Date | null
  initialTime: string | null
  initialNotes: string
  onScheduled?: () => void
}

export function AdjusterAppointmentScheduler({
  leadId,
  clientId = "",
  address = "",
  leadName = "",
  appointmentId = "",
  initialDate,
  initialTime,
  initialNotes,
  onScheduled,
}: AdjusterAppointmentSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(initialDate || undefined)
  const [time, setTime] = useState<string | null>(initialTime || null)
  const [notes, setNotes] = useState(initialNotes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToDoList, setShowToDoList] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  useEffect(() => {
    if (initialDate && initialTime && !isEditing) {
      setShowToDoList(true)
    }
  }, [initialDate, initialTime, isEditing])

  useEffect(() => {
    if (isEditing) {
      setDate(initialDate || undefined)
      setTime(initialTime || null)
      setNotes(initialNotes || "")
      setShowToDoList(false)
    }
  }, [isEditing, initialDate, initialTime, initialNotes])

  const handleSubmit = async () => {
    if (!date || !time) {
      toast({
        title: "Error",
        description: "Please select both a date and time",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Convert time from "8:00 AM" format to "HH:mm" format
      const [timeStr, period] = time.split(" ")
      const [hour, minute] = timeStr.split(":").map(Number)
      let hour24 = hour
      if (period === "PM" && hour !== 12) hour24 += 12
      if (period === "AM" && hour === 12) hour24 = 0

      // Create the appointment date in Eastern Time
      const appointmentDate = new Date(date)
      appointmentDate.setHours(hour24, minute, 0, 0)

      // Format time for database
      const time24 = `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

      // First, schedule the appointment internally
      const result = await scheduleAdjusterAppointmentAction({
        leadId,
        appointmentDate: date.toISOString().split("T")[0],
        appointmentTime: time24,
        appointmentNotes: notes,
      })

      if (result.success) {
        // Calculate end time (1 hour after start time)
        const endDate = new Date(appointmentDate)
        endDate.setHours(endDate.getHours() + 1)

        // Then create the Google Calendar event
        const calendarResponse = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `Adjuster Appointment${leadName ? ` with ${leadName}` : ''}`,
            description: notes || '',
            startTime: appointmentDate.toISOString(),
            endTime: endDate.toISOString(),
            purpose: 'ADJUSTER',
            status: 'SCHEDULED',
            leadId: leadId,
            location: address || '',
            timeZone: 'America/New_York', // Specify Eastern Time zone
          }),
        })

        if (!calendarResponse.ok) {
          const errorData = await calendarResponse.json()
          throw new Error(errorData.message || "Failed to create calendar event")
        }

        toast({
          title: "Success",
          description: "Adjuster appointment scheduled successfully",
          variant: "default",
        })

        setShowToDoList(true)
        if (onScheduled) {
          onScheduled()
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to schedule appointment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelAppointment = async () => {
    try {
      setIsSubmitting(true)

      const result = await scheduleAdjusterAppointmentAction({
        leadId,
        appointmentDate: null,
        appointmentTime: null,
        appointmentNotes: null,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Adjuster appointment cancelled successfully",
        })
        setDate(undefined)
        setTime(null)
        setNotes("")
        setShowToDoList(false)
        setIsEditing(false)
        setCancelDialogOpen(false)
        if (onScheduled) {
          onScheduled()
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to cancel appointment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDateDisabled = (date: Date) => {
    const today = startOfToday()
    const maxDate = addDays(today, 30)
    return isBefore(date, today) || isBefore(maxDate, date)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (initialDate && initialTime) {
      setShowToDoList(true)
    }
  }

  function getGoogleMapsLink(address: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {!showToDoList ? (
          <motion.div
            key="appointment-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card className="border-gray-700 bg-gray-800/50 shadow-md">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {/* Date Picker */}
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Date</div>
                      <CustomDatePicker
                        selected={date}
                        onChange={(date) => setDate(date || undefined)}
                        minDate={new Date()}
                        maxDate={addDays(new Date(), 30)}
                        className="w-full"
                      />
                    </div>

                    {/* Time Picker */}
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Time</div>
                      <Select value={time || ""} onValueChange={setTime}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select time">
                            {time ? (
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4" />
                                {time}
                              </div>
                            ) : (
                              "Select time"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Morning</SelectLabel>
                            {TIME_SLOTS.filter((slot) => slot.display.includes("AM")).map((slot) => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.display}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Afternoon</SelectLabel>
                            {TIME_SLOTS.filter((slot) => slot.display.includes("PM")).map((slot) => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.display}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNotes(!showNotes)}
                      className="h-9 w-9"
                    >
                      <ClipboardList className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open("https://calendar.google.com", "_blank")}
                      className="h-9 w-9"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // Add share functionality
                        if (date && time) {
                          const shareText = `Adjuster appointment scheduled for ${format(date, 'MMM d, yyyy')} at ${time}`;
                          if (navigator.share) {
                            navigator.share({
                              title: 'Adjuster Appointment',
                              text: shareText,
                            });
                          } else {
                            navigator.clipboard.writeText(shareText);
                            toast({
                              title: "Copied to clipboard",
                              description: "Appointment details copied to clipboard",
                            });
                          }
                        }
                      }}
                      className="h-9 w-9"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Notes Section */}
                <AnimatePresence>
                  {showNotes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add appointment notes..."
                        className="min-h-[100px] resize-none mt-2"
                      />
                      {address && (
                        <div className="space-y-2">
                          <div className="font-medium text-sm flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Location
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg border">
                            <p className="text-sm">{address}</p>
                            <a
                              href={getGoogleMapsLink(address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 text-sm flex items-center mt-2"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              View on Google Maps
                            </a>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <div className="flex justify-end gap-2">
                  {isEditing && (
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                      Cancel
                    </Button>
                  )}
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2">⌛</div>
                        {isEditing ? "Updating..." : "Scheduling..."}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {isEditing ? "Update Appointment" : "Schedule Appointment"}
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="appointment-details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-gray-700 bg-gray-800/50 shadow-md overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-green-500/20 p-2 rounded-full mr-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-medium">Appointment Scheduled</CardTitle>
                      <CardDescription className="text-gray-400">
                        {date ? format(date, "EEEE, MMMM d, yyyy") : "Date not set"} • {time || "Time not set"}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {notes && (
                  <div className="mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <ClipboardList className="h-4 w-4 mr-2 text-gray-400" />
                      Notes
                    </h4>
                    <p className="text-gray-400 text-sm whitespace-pre-wrap">{notes}</p>
                  </div>
                )}

                {address && (
                  <div className="mb-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      Location
                    </h4>
                    <p className="text-gray-400 text-sm">{address}</p>
                    <a
                      href={getGoogleMapsLink(address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 text-sm flex items-center mt-2"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      View on Google Maps
                    </a>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-primary" />
                    Preparation Checklist
                  </h4>

                  <div className="space-y-3">
                    {[
                      "Call the client to confirm the appointment date and time",
                      "Remind client to have insurance policy information ready",
                      "Prepare project scope documents to review with adjuster",
                      "Take pre-appointment photos of damage (especially if weather conditions might change)",
                      "Send appointment confirmation email to client with preparation instructions",
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start bg-gray-900/30 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                      >
                        <div className="bg-gray-800 p-1 rounded-full mr-3 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-gray-300">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-gray-700 bg-gray-800/50">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="w-full border-gray-700 hover:bg-gray-700"
                >
                  Modify Appointment
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel Appointment
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-gray-300">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-300">Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to cancel this adjuster appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700">
              No, Keep Appointment
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancelAppointment()
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Yes, Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// --- Helper Function (required at the bottom) ---
function timeToISOTime(time: string) {
  const [hourMinute, period] = time.split(" ")
  let [hour, minute] = hourMinute.split(":").map(Number)

  if (period === "PM" && hour < 12) hour += 12
  if (period === "AM" && hour === 12) hour = 0

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`
}
