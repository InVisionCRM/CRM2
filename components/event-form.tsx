"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type ControllerRenderProps, type SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { GoogleCalendarService } from "@/lib/services/googleCalendar"
import { Checkbox } from "@/components/ui/checkbox"
import { TimePicker } from "@/components/time-picker"

const formSchema = z.object({
  summary: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  startTime: z.string().optional(),
  endDate: z.date({
    required_error: "End date is required",
  }),
  endTime: z.string().optional(),
  isAllDay: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EventFormProps {
  event?: any
}

export function EventForm({ event }: EventFormProps = {}) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const searchParams = useSearchParams()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: event
      ? {
          summary: event.summary,
          description: event.description || "",
          location: event.location || "",
          startDate: new Date(event.start.dateTime || event.start.date),
          startTime: event.start.dateTime ? format(new Date(event.start.dateTime), "HH:mm") : undefined,
          endDate: new Date(event.end.dateTime || event.end.date),
          endTime: event.end.dateTime ? format(new Date(event.end.dateTime), "HH:mm") : undefined,
          isAllDay: !event.start.dateTime,
        }
      : {
          summary: "",
          description: "",
          location: "",
          startDate: new Date(),
          startTime: format(new Date(), "HH:mm"),
          endDate: new Date(),
          endTime: format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
          isAllDay: false,
        },
  })

  // Check if we have a date parameter in the URL
  useEffect(() => {
    if (!event && searchParams) {
      const dateParam = searchParams.get("date")
      if (dateParam) {
        try {
          const parsedDate = new Date(dateParam)
          if (!isNaN(parsedDate.getTime())) {
            form.setValue("startDate", parsedDate)
            form.setValue("endDate", parsedDate)
          }
        } catch (e) {
          console.error("Failed to parse date parameter:", e)
        }
      }
    }
  }, [searchParams, event, form])

  const isAllDay = form.watch("isAllDay")

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)

    try {
      const userId = (session?.user as any)?.id
      const accessToken = session?.accessToken

      if (!userId || !accessToken) {
        throw new Error("User ID or access token not found")
      }

      const calendarService = new GoogleCalendarService({ accessToken, refreshToken: null });

      const eventPayload = {
        summary: data.summary,
        description: data.description,
        location: data.location,
        start: {
          dateTime: data.isAllDay
            ? undefined
            : new Date(`${format(data.startDate, "yyyy-MM-dd")}T${data.startTime || '00:00'}`).toISOString(),
          date: data.isAllDay ? format(data.startDate, "yyyy-MM-dd") : undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: data.isAllDay
            ? undefined
            : new Date(`${format(data.endDate, "yyyy-MM-dd")}T${data.endTime || '00:00'}`).toISOString(),
          date: data.isAllDay ? format(data.endDate, "yyyy-MM-dd") : undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }

      if (event?.id) {
        await calendarService.updateEvent({ ...eventPayload, id: event.id } as any);
      } else {
        await calendarService.createEvent(eventPayload as any);
      }

      router.push("/dashboard/events")
      router.refresh()
    } catch (error) {
      console.error("Failed to save event:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="summary"
          render={({ field }: { field: ControllerRenderProps<FormValues, "summary"> }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Meeting with team" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="isAllDay"
            render={({ field }: { field: ControllerRenderProps<FormValues, "isAllDay"> }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>All-day event</FormLabel>
                  <FormDescription>Event will not have specific start and end times</FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }: { field: ControllerRenderProps<FormValues, "startDate"> }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isAllDay && (
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }: { field: ControllerRenderProps<FormValues, "startTime"> }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <div className="flex items-center">
                    <FormControl>
                      <TimePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <Clock className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }: { field: ControllerRenderProps<FormValues, "endDate"> }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isAllDay && (
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }: { field: ControllerRenderProps<FormValues, "endTime"> }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <div className="flex items-center">
                    <FormControl>
                      <TimePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <Clock className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }: { field: ControllerRenderProps<FormValues, "location"> }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Office, Zoom, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: ControllerRenderProps<FormValues, "description"> }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Add details about this event" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
