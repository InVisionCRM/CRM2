"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type ControllerRenderProps, type SubmitHandler } from "react-hook-form"
import { CalendarIcon, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  appointmentSchema,
  type AppointmentFormValues,
  defaultAppointmentValues,
} from "@/lib/schemas/appointment-schema"
import { PURPOSE_LABELS, type AppointmentPurpose, type AppointmentStatus as AppointmentStatusType } from "@/types/appointments"
import type { CalendarAppointment } from "@/types/appointments"
import { AppointmentPurposeEnum } from "@/types/appointments"
import { AppointmentStatus as AppointmentStatusEnum } from "@prisma/client"

// Generate time slots from 7:00 AM to 8:00 PM in 30-minute increments
const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7
  const minute = (i % 2) * 30
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return {
    value: `${displayHour}:${minute === 0 ? "00" : minute} ${period}`,
    display: `${displayHour}:${minute === 0 ? "00" : minute} ${period}`,
  }
})

// Mock clients for demonstration
/*
const MOCK_CLIENTS = [
  { id: "1", name: "John Smith", address: "123 Main St, Anytown" },
  { id: "2", name: "Sarah Johnson", address: "456 Oak Ave, Somewhere" },
  { id: "3", name: "Michael Brown", address: "789 Pine Rd, Elsewhere" },
  { id: "4", name: "Emily Davis", address: "101 Cedar Ln, Nowhere" },
  { id: "5", name: "Robert Wilson", address: "202 Maple Dr, Anywhere" },
]
*/

interface AppointmentFormProps {
  initialDate?: Date
  initialTime?: string | null
  appointment?: CalendarAppointment
  onSubmit: (values: AppointmentFormValues) => Promise<void>
  onCancel: () => void
}

export function AppointmentForm({ initialDate, initialTime, appointment, onSubmit, onCancel }: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with default values or existing appointment
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment
      ? {
          // Ensure all fields from appointment are correctly mapped to AppointmentFormValues
          title: appointment.title || defaultAppointmentValues.title,
          // Ensure date is a Date object; if appointment.date is undefined, use initialDate or new Date()
          date: appointment.date ? new Date(appointment.date) : (initialDate || new Date()), 
          startTime: appointment.startTime || defaultAppointmentValues.startTime,
          endTime: appointment.endTime || defaultAppointmentValues.endTime,
          // Cast purpose to AppointmentPurpose, defaulting if it's not a valid enum member or undefined
          purpose: Object.values(AppointmentPurposeEnum).includes(appointment.purpose as AppointmentPurpose) 
                    ? appointment.purpose as AppointmentPurpose 
                    : defaultAppointmentValues.purpose,
          // Cast status, defaulting if not valid or undefined
          status: Object.values(AppointmentStatusEnum).includes(appointment.status as AppointmentStatusType) 
                    ? appointment.status as AppointmentStatusType 
                    : defaultAppointmentValues.status, 
          leadId: appointment.leadId || defaultAppointmentValues.leadId,
          userId: appointment.userId || defaultAppointmentValues.userId, // Assuming defaultAppointmentValues has userId
          address: appointment.address || defaultAppointmentValues.address,
          notes: appointment.notes || defaultAppointmentValues.notes,
        }
      : {
          ...defaultAppointmentValues,
          date: initialDate || new Date(),
          startTime: initialTime || defaultAppointmentValues.startTime,
        },
  })

  // Auto-fill address when client changes
  // const watchClientId = form.watch("clientId") // Removed

  /* // Removed useEffect for watchClientId
  useEffect(() => {
    if (watchClientId && !appointment) {
      const selectedClient = MOCK_CLIENTS.find((client) => client.id === watchClientId)
      if (selectedClient) {
        form.setValue("address", selectedClient.address)
      }
    }
  }, [watchClientId, form, appointment])
  */

  // Handle form submission - Renamed to handleFormSubmit
  const handleFormSubmit: SubmitHandler<AppointmentFormValues> = async (data) => {
    // console.log("Form submitted:", data)
    try {
      setIsSubmitting(true)
      await onSubmit(data) // Call the prop onSubmit
    } catch (error) {
      console.error("Failed to submit appointment:", error)
      // Optionally, show a toast message or other error feedback to the user
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pb-10">
        <div className="space-y-4">
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }: { field: ControllerRenderProps<AppointmentFormValues, "title"> }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Appointment title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }: { field: ControllerRenderProps<AppointmentFormValues, "date"> }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }: { field: ControllerRenderProps<AppointmentFormValues, "startTime"> }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || initialTime || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time">
                          {field.value ? (
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {field.value}
                            </div>
                          ) : (
                            "Select start time"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }: { field: ControllerRenderProps<AppointmentFormValues, "endTime"> }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end time">
                          {field.value ? (
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {field.value}
                            </div>
                          ) : (
                            "Select end time"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Purpose */}
          <FormField
            control={form.control}
            name="purpose"
            render={({ field }: { field: ControllerRenderProps<AppointmentFormValues, "purpose"> }) => (
              <FormItem>
                <FormLabel>Purpose</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }: { field: ControllerRenderProps<AppointmentFormValues, "address"> }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Appointment location" {...field} />
                </FormControl>
                <FormDescription>This will be auto-filled from client information but can be changed.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }: { field: ControllerRenderProps<AppointmentFormValues, "notes"> }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any details about the appointment"
                    className="min-h-[100px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : appointment ? "Update Appointment" : "Create Appointment"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
