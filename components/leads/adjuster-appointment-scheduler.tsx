"use client"

import { useState, useEffect } from "react"
import { format, addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  Clock, 
  Trash2, 
  CalendarDays, 
  ClipboardList, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  RotateCcw
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
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
import { CustomDatePicker } from "@/components/custom-date-picker"
import { useCreateAppointment } from "@/hooks/use-create-appointment"
import { useUpdateAppointment } from "@/hooks/use-update-appointment"
import { useDeleteAppointment } from "@/hooks/use-delete-appointment"
import type { AppointmentFormData } from "@/types/appointments"
import { Badge } from "@/components/ui/badge"
import { AppointmentPurposeEnum } from '@/types/appointments'
import { AppointmentStatus } from '@prisma/client'

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
  const [hour] = time.split(":").map(Number)
  if (period === "PM" && hour === 7 && Number(time.split(":")[1]) > 30) return false
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
  const [time, setTime] = useState<string>(initialTime || "")
  const [notes, setNotes] = useState<string>(initialNotes || "")
  const [showToDoList, setShowToDoList] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [rescheduleOption, setRescheduleOption] = useState<"cancel" | "reschedule" | null>(null)

  const { createAppointment, isLoading: isCreating, error: createError } = useCreateAppointment()
  const { updateAppointment, isLoading: isUpdating, error: updateError } = useUpdateAppointment()
  const { deleteAppointment, isLoading: isDeleting, error: deleteError } = useDeleteAppointment()

  const isSubmitting = isCreating || isUpdating || isDeleting

  // Set initial state based on props
  useEffect(() => {
    if (initialDate && initialTime && !isEditing) {
      setShowToDoList(true)
    }
  }, [initialDate, initialTime, isEditing])

  const formatAppointmentData = (): AppointmentFormData => {
    if (!date || !time) {
      throw new Error("Date and time are required")
    }

    // Calculate endTime - default to 1 hour after startTime
    const [timeStr, period] = time.split(" ")
    const [hour, minute] = timeStr.split(":").map(Number)
    
    let endHour = hour + 1
    let endPeriod = period
    
    if (period === "AM" && endHour === 12) {
      endPeriod = "PM"
    } else if (period === "PM" && endHour > 12) {
      endHour = endHour - 12
    }
    
    const endTime = `${endHour}:${minute === 0 ? "00" : minute} ${endPeriod}`
    
    return {
      title: `Inspection with ${leadName || 'Client'}`,
      startTime: time,
      endTime,
      purpose: AppointmentPurposeEnum.INSPECTION,
      status: AppointmentStatus.SCHEDULED,
      leadId: clientId || leadId,
      address: address || '',
      notes: notes || ''
    }
  }

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
      const appointmentData = formatAppointmentData()
      console.log("Submitting appointment data:", JSON.stringify(appointmentData))
      
      if (isEditing && appointmentId) {
        console.log("Updating appointment with ID:", appointmentId)
        const result = await updateAppointment(appointmentId, appointmentData)
        console.log("Update result:", result)
        
        toast({
          title: "Success",
          description: "Adjuster appointment updated successfully",
          variant: "default",
          className: "bg-green-500 text-white"
        })
      } else {
        console.log("Creating new appointment")
        const result = await createAppointment(appointmentData)
        console.log("Creation result:", result)
        
        toast({
          title: "Success",
          description: "Adjuster appointment scheduled successfully",
          variant: "default",
          className: "bg-green-500 text-white"
        })
      }
      
      setShowToDoList(true)
      setIsEditing(false)
      if (onScheduled) {
        onScheduled()
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointmentId) {
      setDate(undefined)
      setTime("")
      setNotes("")
      setShowToDoList(false)
      setIsEditing(false)
      setCancelDialogOpen(false)
      return
    }

    try {
      const result = await deleteAppointment(appointmentId)
      
      if (result) {
        toast({
          title: "Success",
          description: "Adjuster appointment cancelled successfully",
          variant: "default",
          className: "bg-green-500 text-white"
        })
      }
      
      setDate(undefined)
      setTime("")
      setNotes("")
      setShowToDoList(false)
      setIsEditing(false)
      setCancelDialogOpen(false)
      
      if (onScheduled) {
        onScheduled()
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (initialDate && initialTime) {
      setShowToDoList(true)
    }
  }

  const handleEdit = () => {
    setDate(initialDate || undefined)
    setTime(initialTime || "")
    setNotes(initialNotes || "")
    setIsEditing(true)
    setShowToDoList(false)
  }

  const handleReschedule = () => {
    setRescheduleOption("reschedule")
    setCancelDialogOpen(false)
    setIsEditing(true)
    setShowToDoList(false)
  }

  if (!showToDoList) {
    return (
      <div className="space-y-6">
        <Card className="border-2 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              {isEditing ? "Update Appointment" : "Schedule Appointment"}
              {rescheduleOption === "reschedule" && (
                <Badge variant="outline" className="ml-3 px-2 py-0 bg-yellow-100 text-yellow-800 border-yellow-300">
                  Rescheduling
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Select a date and time for the adjuster to visit the property</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date
                </div>
                <CustomDatePicker
                  selected={date}
                  onChange={(date) => setDate(date)}
                  minDate={new Date()}
                  maxDate={addDays(new Date(), 30)}
                />
              </div>

              <div className="space-y-2">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Time
                </div>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="h-12 border-2">
                    <SelectValue placeholder="Select time">
                      {time ? (
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-primary" />
                          {time}
                        </div>
                      ) : (
                        "Select time"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-primary">Morning</SelectLabel>
                      {TIME_SLOTS.filter((slot) => slot.display.includes("AM")).map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.display}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-primary">Afternoon</SelectLabel>
                      {TIME_SLOTS.filter(
                        (slot) => slot.display.includes("PM") && Number.parseInt(slot.display) < 5,
                      ).map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.display}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-primary">Evening</SelectLabel>
                      {TIME_SLOTS.filter(
                        (slot) => slot.display.includes("PM") && Number.parseInt(slot.display) >= 5,
                      ).map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.display}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Meeting Notes
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any details about the appointment"
                className="min-h-[100px] resize-none border-2"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4 border-t">
            {isEditing && (
              <Button 
                variant="outline" 
                onClick={handleCancelEdit} 
                className="text-xs h-10 border-2"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              {isEditing && initialDate && initialTime && (
                <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 border border-red-200 hover:bg-red-50 hover:text-red-600"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Appointment Options</AlertDialogTitle>
                      <AlertDialogDescription>
                        Would you like to cancel this appointment or reschedule it?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-3 sm:justify-start">
                      <AlertDialogCancel className="mt-0">Keep Appointment</AlertDialogCancel>
                      <Button
                        onClick={handleReschedule}
                        className="bg-yellow-600 text-white hover:bg-yellow-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reschedule
                      </Button>
                      <Button
                        onClick={handleCancelAppointment}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !date || !time}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 text-xs font-medium"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Appointment"
                ) : (
                  "Schedule Appointment"
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Card className="border-2 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-500/20 p-2 rounded-full mr-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-medium">Appointment Scheduled</CardTitle>
                <CardDescription className="text-green-700">
                  {date ? format(date, "EEE, MMM d, yyyy") : "Date not set"} • {time || "Time not set"}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setCancelDialogOpen(true)}
                className="h-8 w-8 border border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8 text-xs">
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {notes && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <ClipboardList className="h-4 w-4 mr-2 text-primary" />
                Notes
              </h4>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center">
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
                <div key={index} className="flex items-start bg-gray-50 p-3 rounded-lg border-l-4 border-l-primary">
                  <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 border-t bg-gray-50">
          <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Appointment Options</AlertDialogTitle>
                <AlertDialogDescription>
                  Would you like to cancel this appointment or reschedule it?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-3 sm:justify-start">
                <AlertDialogCancel className="mt-0">Keep Appointment</AlertDialogCancel>
                <Button
                  onClick={handleReschedule}
                  className="bg-yellow-600 text-white hover:bg-yellow-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
                <Button
                  onClick={handleCancelAppointment}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  )
}
