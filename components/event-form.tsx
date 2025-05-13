"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type ControllerRenderProps, type SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Clock, ChevronsUpDown, Check } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { GoogleCalendarService } from "@/lib/services/googleCalendar"
import { Checkbox } from "@/components/ui/checkbox"
import { TimePicker } from "@/components/time-picker" // Assuming this is your custom time picker
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command"

// Define a type for the lead search results
interface LeadSearchResult {
  id: string;
  name: string;
}

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
  leadId: z.string().optional(),
  leadName: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EventFormProps {
  event?: any // Consider defining a more specific type for the event object
  initialLeadId?: string
  initialLeadName?: string
  initialEventDate?: string
  onFormSubmit?: (data: FormValues) => void
  onCancel?: () => void
}

export function EventForm({ event, initialLeadId, initialLeadName, initialEventDate, onFormSubmit, onCancel }: EventFormProps = {}) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const [leadAddress, setLeadAddress] = useState<string>('')

  // State for lead combobox
  const [isLeadPopoverOpen, setIsLeadPopoverOpen] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [searchedLeads, setSearchedLeads] = useState<LeadSearchResult[]>([]);
  const [isLeadSearching, setIsLeadSearching] = useState(false);
  const [leadSearchError, setLeadSearchError] = useState<string | null>(null);

  // console.log("[EventForm] Props received:", { initialLeadId, initialLeadName, initialEventDate }); // Debugging

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: event
      ? {
          summary: event.summary || "",
          description: event.description || "",
          location: event.location || "",
          startDate: new Date(event.start.dateTime || event.start.date),
          startTime: event.start.dateTime ? format(new Date(event.start.dateTime), "HH:mm") : undefined,
          endDate: new Date(event.end.dateTime || event.end.date),
          endTime: event.end.dateTime ? format(new Date(event.end.dateTime), "HH:mm") : undefined,
          isAllDay: !event.start.dateTime,
          leadId: event?.extendedProperties?.private?.leadId || initialLeadId || "",
          leadName: event?.extendedProperties?.private?.leadName || initialLeadName || "",
        }
      : {
          summary: "",
          description: "",
          location: "",
          startDate: initialEventDate ? new Date(initialEventDate) : new Date(),
          startTime: initialEventDate ? format(new Date(initialEventDate), "HH:mm") : format(new Date(), "HH:mm"),
          endDate: initialEventDate ? new Date(initialEventDate) : new Date(),
          endTime: initialEventDate 
            ? format(new Date(new Date(initialEventDate).getTime() + 60 * 60 * 1000), "HH:mm") 
            : format(new Date(Date.now() + 60 * 60 * 1000), "HH:mm"),
          isAllDay: false,
          leadId: initialLeadId || "",
          leadName: initialLeadName || "",
        },
  })

  useEffect(() => {
    if (!event && searchParams) {
      const dateParam = searchParams.get("date")
      if (dateParam) {
        try {
          const parsedDate = new Date(dateParam) // Ensure dateParam is in a format Date constructor understands
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

  useEffect(() => {
    if (initialLeadId) {
      fetch(`/api/leads/${initialLeadId}`)
        .then(res => res.json())
        .then(data => {
          if (data.address) {
            setLeadAddress(data.address)
          }
        })
        .catch(console.error)
    }
  }, [initialLeadId])

  const isAllDay = form.watch("isAllDay")

  // Use form.watch to get reactive values for display in the combobox trigger
  const watchedLeadId = form.watch("leadId");
  const watchedLeadName = form.watch("leadName");

  // Placeholder for debounced lead fetching logic
  // const debouncedLeadSearch = useDebounce(leadSearchQuery, 500);

  // Placeholder for actual API call to fetch leads
  const fetchLeads = async (query: string) => {
    if (!query) {
      setSearchedLeads([]);
      return;
    }
    setIsLeadSearching(true);
    setLeadSearchError(null);
    try {
      // Replace with your actual API call
      // const response = await fetch(`/api/leads/search?name=${encodeURIComponent(query)}`);
      // if (!response.ok) throw new Error('Failed to fetch leads');
      // const data = await response.json();
      // setSearchedLeads(data.leads || []); 
      console.log("Fetching leads for:", query); // Placeholder
      // Dummy data for now:
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      if (query.toLowerCase().startsWith("test")) {
        setSearchedLeads([
          { id: "lead1", name: "Test Lead One" },
          { id: "lead2", name: "Test Lead Two" },
        ]);
      } else {
        setSearchedLeads([]);
      }
    } catch (error) {
      console.error("Failed to search leads:", error);
      setLeadSearchError(error instanceof Error ? error.message : "An unknown error occurred");
      setSearchedLeads([]);
    } finally {
      setIsLeadSearching(false);
    }
  };

  useEffect(() => {
    // This would be triggered by debouncedLeadSearch in a real implementation
    if (leadSearchQuery) {
        fetchLeads(leadSearchQuery);
    } else {
        setSearchedLeads([]);
    }
  }, [leadSearchQuery]); // Replace leadSearchQuery with debouncedLeadSearch when useDebounce is implemented

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true)

    try {
      const userId = (session?.user as any)?.id // Consider a more specific type for session.user
      const accessToken = session?.accessToken

      if (!userId || !accessToken) {
        throw new Error("User ID or access token not found")
      }

      const calendarService = new GoogleCalendarService({ accessToken, refreshToken: null }) // refreshToken might be needed for long-lived sessions

      const baseEventPayload = {
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
        extendedProperties: {
          private: {
            leadId: data.leadId || undefined, // Ensure undefined if empty string or null
            leadName: data.leadName || undefined, // Ensure undefined if empty string or null
          }
        }
      };

      if (event?.id) {
        await calendarService.updateEvent({ ...baseEventPayload, id: event.id } as any) // Type appropriately
      } else {
        await calendarService.createEvent(baseEventPayload as any) // Type appropriately
      }

      if (onFormSubmit) {
        onFormSubmit(data); // Callback handles modal close and data refresh
      } else {
        router.push("/dashboard/events"); // Fallback if not used in modal
      }
      // router.refresh() was here, but onFormSubmit should handle its own refresh,
      // and router.push to a new page implies that page will fetch its data.
    } catch (error) {
      console.error("Failed to save event:", error)
      // Consider adding user-friendly error feedback here (e.g., a toast notification)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save event',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Meeting with team" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAllDay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>All-day event</FormLabel>
                <FormDescription>
                  Event will not have specific start and end times.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
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
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <TimePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
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
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
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
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <TimePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add details about this event"
                  className="min-h-[120px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="leadId" // This field primarily controls the ID
          render={({ field }) => ( // field here refers to leadId field controller
            <FormItem className="flex flex-col">
              <FormLabel>Lead</FormLabel>
              <Popover open={isLeadPopoverOpen} onOpenChange={setIsLeadPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isLeadPopoverOpen}
                      className={cn(
                        "w-full justify-between",
                        !watchedLeadId && "text-muted-foreground" // Use watchedLeadId for disabled style
                      )}
                    >
                      {watchedLeadId // Display based on watchedLeadId and watchedLeadName
                        ? watchedLeadName || watchedLeadId // Show name if available, else ID
                        : "Select Lead..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search lead name..." 
                      value={leadSearchQuery}
                      onValueChange={setLeadSearchQuery}
                    />
                    <CommandList>
                      {/* ... CommandItems ... */}
                      {searchedLeads.map((lead: LeadSearchResult) => (
                          <CommandItem
                            value={lead.name} 
                            key={lead.id}
                            onSelect={() => {
                              form.setValue("leadId", lead.id, { shouldDirty: true });
                              form.setValue("leadName", lead.name, { shouldDirty: true });
                              setIsLeadPopoverOpen(false);
                              setLeadSearchQuery("");
                              setSearchedLeads([]);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                lead.id === watchedLeadId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {lead.name}
                          </CommandItem>
                        ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Associate this event with a specific lead by searching.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                {/* You can use a spinner icon here if you have one, e.g., from lucide-react */}
                {/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}
                Saving...
              </>
            ) : event?.id ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 