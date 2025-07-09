"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarIcon, Clock, DollarSign, Building2, CalendarPlus, ChevronDownIcon, ExternalLink, Trash2, Mail, ChevronDown } from "lucide-react"
import { format, addHours, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { Lead } from "@prisma/client"
import type { RawGCalEvent } from "@/types/appointments"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ImportantDatesProps {
  lead: Lead | null
}

interface CategorizedEvents {
  adjuster: RawGCalEvent[]
  build: RawGCalEvent[]
  acv: RawGCalEvent[]
  rcv: RawGCalEvent[]
  userEmail?: string
}

interface EventCreationData {
  type: 'adjuster' | 'build' | 'acv' | 'rcv'
  label: string
  title: string
  description: string
  icon: React.ReactNode
}

interface ImportantDateData {
  key: string
  label: string
  icon: React.ReactNode
}

export function ImportantDates({ lead }: ImportantDatesProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [scheduledEvents, setScheduledEvents] = useState<CategorizedEvents>({
    adjuster: [],
    build: [],
    acv: [],
    rcv: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<EventCreationData | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("09:00")
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [lastCreatedEventUrl, setLastCreatedEventUrl] = useState<string | null>(null)
  
  // New state for important dates
  const [isImportantDateModalOpen, setIsImportantDateModalOpen] = useState(false)
  const [selectedImportantDate, setSelectedImportantDate] = useState<Date>()
  const [selectedImportantDateType, setSelectedImportantDateType] = useState<ImportantDateData | null>(null)
  const [isUpdatingImportantDate, setIsUpdatingImportantDate] = useState(false)
  const [isDeletingImportantDate, setIsDeletingImportantDate] = useState(false)

  // Reminder email dialog state
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [lastScheduledInfo, setLastScheduledInfo] = useState<{
    eventType: EventCreationData
    scheduledDate: Date
    formattedTime: string
  } | null>(null)
  const [isSendingReminder, setIsSendingReminder] = useState(false)

  // State for calendar viewer
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false)

  if (!lead) return null

  const leadName = [lead.firstName, lead.lastName].filter(Boolean).join(" ")
  const leadAddress = lead.address || ""
  const claimNumber = lead.claimNumber || ""
  const userEmail = session?.user?.email || ""

  // Get important dates from metadata
  const getImportantDateFromMetadata = (dateKey: string): string | null => {
    const metadata = lead.metadata as Record<string, any> | null
    return metadata?.importantDates?.[dateKey] || null
  }

  // Important dates configuration (Job Completion handled by its own component)
  const importantDates: ImportantDateData[] = []
  
  // Handle important date button click
  const handleImportantDateClick = (dateData: ImportantDateData) => {
    setSelectedImportantDateType(dateData)
    const existingDate = getImportantDateFromMetadata(dateData.key)
    setSelectedImportantDate(existingDate ? new Date(existingDate) : undefined)
    setIsImportantDateModalOpen(true)
  }

  // Handle important date save
  const handleSaveImportantDate = async () => {
    if (!selectedImportantDateType || !selectedImportantDate) {
      toast({
        title: "Missing Information",
        description: "Please select a date",
        variant: "destructive",
        duration: 3000
      })
      return
    }

    setIsUpdatingImportantDate(true)
    try {
      // Store date as local YYYY-MM-DD string to avoid timezone shifts across
      // different environments. We compute an ISO date string in local time
      // (remove the timezone offset) and persist only the calendar date part.
      const tzOffset = selectedImportantDate.getTimezoneOffset() * 60000
      const localISODateOnly = new Date(selectedImportantDate.getTime() - tzOffset)
        .toISOString()
        .split("T")[0]

      const response = await fetch(`/api/leads/${lead.id}/important-dates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateType: selectedImportantDateType.key,
          date: localISODateOnly
        })
      })

      if (response.ok) {
        toast({
          title: "✅ Date Updated Successfully!",
          description: `${selectedImportantDateType.label} set to ${format(selectedImportantDate, "MMM d, yyyy")}`,
          duration: 3000
        })
        setIsImportantDateModalOpen(false)
        // Update the lead data in the parent component by triggering a refetch
        window.location.reload() // Simple approach - could be optimized with proper state management
      } else {
        const error = await response.json()
        toast({
          title: "Failed to Update Date",
          description: error.error || "Failed to update important date",
          variant: "destructive",
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error updating important date:', error)
      toast({
        title: "Error",
        description: "Failed to update important date",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsUpdatingImportantDate(false)
    }
  }

  // Handle important date delete
  const handleDeleteImportantDate = async () => {
    if (!selectedImportantDateType) {
      return
    }

    setIsDeletingImportantDate(true)
    try {
      const response = await fetch(`/api/leads/${lead.id}/important-dates`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateType: selectedImportantDateType.key
        })
      })

      if (response.ok) {
        toast({
          title: "✅ Date Deleted Successfully!",
          description: `${selectedImportantDateType.label} date has been removed`,
          duration: 3000
        })
        setIsImportantDateModalOpen(false)
        // Update the lead data in the parent component by triggering a refetch
        window.location.reload() // Simple approach - could be optimized with proper state management
      } else {
        const error = await response.json()
        toast({
          title: "Failed to Delete Date",
          description: error.error || "Failed to delete important date",
          variant: "destructive",
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error deleting important date:', error)
      toast({
        title: "Error",
        description: "Failed to delete important date",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsDeletingImportantDate(false)
    }
  }

  // Fetch scheduled events from Google Calendar
  const fetchScheduledEvents = async () => {
    if (!lead.id || !leadName || !session?.user?.email) return
    
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        leadId: lead.id,
        leadName: leadName
      })
      
      const response = await fetch(`/api/calendar/lead-events?${params}`)
      if (response.ok) {
        const events = await response.json()
        setScheduledEvents(events)
      } else {
        console.error('Failed to fetch events:', response.status)
      }
    } catch (error) {
      console.error('Error fetching scheduled events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledEvents()
  }, [lead.id, leadName, session?.user?.email])

  // Helper function to format date for display
  const formatEventDate = (event: RawGCalEvent) => {
    if (!event.start) return null
    
    const dateString = event.start.dateTime || event.start.date
    if (!dateString) return null
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return null
      
      if (event.start.date && !event.start.dateTime) {
        return format(date, "MMM d, yyyy")
      }
      
      return format(date, "MMM d, h:mm a")
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return null
    }
  }

  // Helper function to get the most recent event for a category
  const getRecentEvent = (events: RawGCalEvent[]) => {
    if (events.length === 0) return null
    
    const sortedEvents = events.sort((a, b) => {
      const dateA = new Date(a.start?.dateTime || a.start?.date || '')
      const dateB = new Date(b.start?.dateTime || b.start?.date || '')
      return dateB.getTime() - dateA.getTime()
    })
    
    return sortedEvents[0]
  }

  // Calendar event configurations
  const calendarEvents: EventCreationData[] = [
    {
      type: 'adjuster',
      label: "Adjuster Appointment",
      title: `Adjuster Appointment - ${leadName}`,
      description: `Adjuster Appointment\n\nLead: ${leadName}\nAddress: ${leadAddress}\nPhone: ${lead.phone || "N/A"}\nEmail: ${lead.email || "N/A"}\nClaim #: ${claimNumber}\nInsurance: ${lead.insuranceCompany || "N/A"}\nAdjuster: ${lead.insuranceAdjusterName || "N/A"}\nAdjuster Phone: ${lead.insuranceAdjusterPhone || "N/A"}`,
      icon: <Clock className="h-4 w-4" />
    },
    {
      type: 'build',
      label: "Build Date",
      title: `Build Date - ${leadName}`,
      description: `Build Date Scheduled\n\nLead: ${leadName}\nAddress: ${leadAddress}\nPhone: ${lead.phone || "N/A"}\nEmail: ${lead.email || "N/A"}\nClaim #: ${claimNumber}\nInsurance: ${lead.insuranceCompany || "N/A"}`,
      icon: <Building2 className="h-4 w-4" />
    },
    {
      type: 'acv',
      label: "Pick up ACV",
      title: `ACV Pickup - ${leadName}`,
      description: `ACV Check Pickup\n\nLead: ${leadName}\nAddress: ${leadAddress}\nPhone: ${lead.phone || "N/A"}\nEmail: ${lead.email || "N/A"}\nClaim #: ${claimNumber}\nInsurance: ${lead.insuranceCompany || "N/A"}\nDamage Type: ${lead.damageType || "N/A"}`,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      type: 'rcv',
      label: "Pick up RCV",
      title: `RCV Pickup - ${leadName}`,
      description: `RCV Check Pickup\n\nLead: ${leadName}\nAddress: ${leadAddress}\nPhone: ${lead.phone || "N/A"}\nEmail: ${lead.email || "N/A"}\nClaim #: ${claimNumber}\nInsurance: ${lead.insuranceCompany || "N/A"}\nDamage Type: ${lead.damageType || "N/A"}`,
      icon: <DollarSign className="h-4 w-4" />
    }
  ]

  const handleEventButtonClick = (eventData: EventCreationData) => {
    if (!userEmail) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create calendar events",
        variant: "destructive",
        duration: 3000
      })
      return
    }

    setSelectedEventType(eventData)
    setEventTitle(eventData.title)
    setEventDescription(eventData.description)
    setSelectedDate(new Date())
    setSelectedTime("09:00")
    setIsEventModalOpen(true)
  }

  const handleCreateEvent = async () => {
    if (!selectedEventType || !selectedDate || !eventTitle) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
        duration: 3000
      })
      return
    }

    setIsCreating(true)
    try {
      // Combine date and time (this is the user's selected time)
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startDateTime = new Date(selectedDate)
      startDateTime.setHours(hours, minutes, 0, 0)
      
      const endDateTime = addHours(startDateTime, 1) // Default 1 hour duration

      const response = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          leadId: lead.id,
          leadName: leadName,
          eventType: selectedEventType.type,
          location: leadAddress
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Calendar event created:', result) // Debug logging
        console.log('Time verification:', {
          userSelectedTime: selectedTime,
          originalStartTime: result.originalStartTime,
          adjustedStartTime: result.adjustedStartTime,
          googleCalendarUrl: result.eventUrl
        })
        setLastCreatedEventUrl(result.eventUrl)
        
        // Capture info for reminder dialog
        const userSelectedTime = selectedTime
        const [hours, minutes] = userSelectedTime.split(":").map(Number)
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        const ampm = hours >= 12 ? "PM" : "AM"
        const formattedUserTime = `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`

        setLastScheduledInfo({
          eventType: selectedEventType,
          scheduledDate: new Date(selectedDate),
          formattedTime: formattedUserTime,
        })
        
        // Show success toast with the original user-selected time
        toast({
          title: "✅ Event Created Successfully!",
          description: `${selectedEventType.label} scheduled for ${format(selectedDate, "MMM d")} at ${formattedUserTime}. Event created in Google Calendar.`,
          duration: 3000
        })
        
        // Show Google Calendar link if available
        if (result.eventUrl) {
          console.log('Google Calendar URL:', result.eventUrl) // Debug logging
          setTimeout(() => {
            toast({
              title: "📅 View Event",
              description: (
                <div className="flex items-center gap-2">
                  <span>Open event in Google Calendar</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.eventUrl, '_blank', 'noopener,noreferrer')}
                    className="ml-2"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              ),
              duration: 8000
            })
          }, 1000)
        }
        
        setIsEventModalOpen(false)
        // Open reminder prompt dialog
        setIsReminderDialogOpen(true)
        // Refresh the events list
        await fetchScheduledEvents()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to Create Event",
          description: error.error || "Failed to create calendar event",
          variant: "destructive",
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error",
        description: "Failed to create calendar event",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Build email subject/body dynamically so the time is always in 12-hour format
  const buildReminderTemplate = (
    type: EventCreationData['type'],
    dateObj: Date,
    time12hr: string
  ): { subject: string; body: string } => {
    const common = {
      first: lead.firstName || '',
      sales: session?.user?.name || '',
      dateStr: format(dateObj, 'MMM d, yyyy'),
      timeStr: time12hr,
    }
    switch (type) {
      case 'adjuster':
        return {
          subject: `Reminder: Adjuster Appointment on ${common.dateStr}`,
          body: `Hi ${common.first},\n\nThis is a friendly reminder of your adjuster appointment on ${common.dateStr} at ${common.timeStr}.\n\nIf you have any questions please let me know.\n\nThank you,\n${common.sales}`,
        }
      case 'build':
        return {
          subject: `Build Date confirmed – ${common.dateStr}`,
          body: `Hi ${common.first},\n\nGreat news! Your build date is set for ${common.dateStr}. Our crew will arrive around ${common.timeStr}.\n\nLet me know if you need anything.\n\nBest,\n${common.sales}`,
        }
      case 'acv':
        return {
          subject: `ACV Check pickup scheduled – ${common.dateStr}`,
          body: `Hi ${common.first},\n\nJust a reminder that I'll stop by to pick up the ACV check on ${common.dateStr} at ${common.timeStr}.\n\nThank you,\n${common.sales}`,
        }
      case 'rcv':
        return {
          subject: `RCV Check pickup scheduled – ${common.dateStr}`,
          body: `Hi ${common.first},\n\nReminder that I'll be by on ${common.dateStr} at ${common.timeStr} to collect the RCV check.\n\nPlease reach out with any questions.\n\nThanks,\n${common.sales}`,
        }
    }
  }

  const handleSendReminderEmail = async () => {
    if (!lead.email || !lastScheduledInfo) {
      toast({ title: 'No email on file', variant: 'destructive' })
      return
    }
    setIsSendingReminder(true)
    try {
      const tpl = buildReminderTemplate(
        lastScheduledInfo.eventType.type,
        lastScheduledInfo.scheduledDate,
        lastScheduledInfo.formattedTime
      )
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: lead.email, subject: tpl.subject, text: tpl.body })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send email')
      }
      toast({ title: 'Email sent!', description: `Reminder email sent to ${lead.email}` })
      setIsReminderDialogOpen(false)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSendingReminder(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "relative flex h-16 flex-1 items-center justify-center backdrop-blur-lg p-1 text-sm font-bold text-white",
              "first:border-l-0 transition-all duration-300",
              "bg-gradient-to-br from-blue-700/90 via-blue-600/90 to-blue-700/90 border-l border-blue-500/50 hover:from-blue-600/90 hover:via-blue-500/90 hover:to-blue-600/90 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/20",
              "hover:scale-[1.02] active:scale-[0.98]",
              "cursor-pointer"
            )}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="p-1 bg-white/10 rounded-md">
                <CalendarIcon className="h-4 w-4 text-blue-200" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs leading-tight font-semibold text-blue-100">Appointments</span>
                <ChevronDown className="h-3 w-3 text-blue-200 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-80 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-slate-600/50 backdrop-blur-xl shadow-2xl shadow-black/50 rounded-xl overflow-hidden"
          side="bottom"
          align="center"
          sideOffset={8}
        >
          <div className="p-2">
            {/* Important Dates Section */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 px-2">Important Dates</h3>
              {importantDates.map((dateData, index) => {
                const savedDateText = getImportantDateFromMetadata(dateData.key)
                const formattedDate = savedDateText ? format(parseISO(savedDateText), "MMM d, yyyy") : null
                
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleImportantDateClick(dateData)}
                    disabled={isUpdatingImportantDate || isDeletingImportantDate}
                    className="flex items-center gap-4 text-white hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-blue-500/20 focus:bg-gradient-to-r focus:from-blue-600/20 focus:to-blue-500/20 cursor-pointer py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-blue-500/30"
                  >
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-500/30">
                      {dateData.icon}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="text-sm font-semibold text-gray-100">{dateData.label}</span>
                      {formattedDate && (
                        <span className="text-xs text-blue-300">{formattedDate}</span>
                      )}
                      {!formattedDate && (
                        <span className="text-xs text-gray-400">Click to set</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>

            <DropdownMenuSeparator className="my-2" />

            {/* Calendar Events Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 px-2">Schedule to Google Calendar</h3>
              {calendarEvents.map((eventData, index) => {
                const scheduledEvent = getRecentEvent(scheduledEvents[eventData.type])
                const scheduledDate = scheduledEvent ? formatEventDate(scheduledEvent) : null
                const eventCount = scheduledEvents[eventData.type]?.length || 0
                
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleEventButtonClick(eventData)}
                    disabled={!userEmail || isLoading || isCreating}
                    className="flex items-center gap-4 text-white hover:bg-gradient-to-r hover:from-green-600/20 hover:to-green-500/20 focus:bg-gradient-to-r focus:from-green-600/20 focus:to-green-500/20 cursor-pointer py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-green-500/30"
                  >
                    <div className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30">
                      {eventData.icon}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <span className="text-sm font-semibold text-gray-100">{eventData.label}</span>
                      {scheduledDate && (
                        <span className="text-xs text-green-300">{scheduledDate}</span>
                      )}
                      {eventCount > 0 && !scheduledDate && (
                        <span className="text-xs text-green-300">{eventCount} scheduled</span>
                      )}
                      {eventCount > 1 && scheduledDate && (
                        <span className="text-xs text-green-300">+{eventCount - 1} more</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </div>

            {/* View Calendar Link */}
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              onClick={() => setIsCalendarDialogOpen(true)}
              className="flex items-center gap-4 text-white hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-indigo-500/20 focus:bg-gradient-to-r focus:from-indigo-600/20 focus:to-indigo-500/20 cursor-pointer py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-indigo-500/30"
            >
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-lg border border-indigo-500/30">
                <CalendarIcon className="h-4 w-4 text-indigo-300" />
              </div>
              <span className="text-sm font-semibold text-gray-100">View Calendar</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Event Creation Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Schedule {selectedEventType?.label}
            </DialogTitle>
            <DialogDescription>
              Create a calendar event for {leadName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Date & Time</Label>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {selectedDate && selectedTime 
                      ? (() => {
                          const [hours, minutes] = selectedTime.split(':').map(Number)
                          const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
                          const ampm = hours >= 12 ? 'PM' : 'AM'
                          const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'short' })
                          const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
                          return `${dayOfWeek}, ${dateStr} at ${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
                        })()
                      : "Select date & time"
                    }
                    <ChevronDownIcon />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Select Date & Time</DrawerTitle>
                  </DrawerHeader>
                  <div className="flex justify-center pb-4 px-4">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start w-full max-w-3xl">
                      <div className="flex flex-col items-center w-full lg:w-auto">
                        <h3 className="text-sm font-medium mb-3">Date</h3>
                        <div className="scale-90">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              setSelectedDate(date)
                            }}
                            disabled={(date: Date) => date < new Date()}
                            classNames={{
                              day_selected: "bg-blue-50 text-white font-medium hover:bg-blue-100 hover:text-black focus:bg-blue-50 focus:text-black"
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full lg:w-auto">
                        <h3 className="text-sm font-medium mb-3">Time</h3>
                        <div className="space-y-3 w-full max-w-xs">
                          <div className="bg-black border rounded-lg p-3 shadow-sm">
                            <div className="text-center mb-4">
                              <div className="text-lg text-lime-400 font-medium">
                                {(() => {
                                  const [hours, minutes] = selectedTime.split(':').map(Number)
                                  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
                                  const ampm = hours >= 12 ? 'PM' : 'AM'
                                  return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`
                                })()}
                              </div>
                              <button 
                                className="text-lime-500 text-sm font-medium mt-1 px-3 py-1 rounded hover:bg-lime-500/10 transition-colors"
                                onClick={() => {
                                  const now = new Date()
                                  const hours = now.getHours().toString().padStart(2, '0')
                                  const minutes = now.getMinutes().toString().padStart(2, '0')
                                  setSelectedTime(`${hours}:${minutes}`)
                                }}
                              >
                                NOW
                              </button>
                            </div>
                            
                            <div className="flex justify-center items-center gap-2 sm:gap-4">
                              {/* Hours */}
                              <div className="flex flex-col items-center">
                                <div className="text-sm text-white mb-2">Hour</div>
                                <div className="h-28 w-12 sm:w-14 overflow-y-auto scrollbar-hide">
                                  <div className="py-2">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                                      const currentHour = parseInt(selectedTime.split(':')[0])
                                      const hour24 = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour
                                      const isSelected = hour24 === hour
                                      return (
                                        <div
                                          key={hour}
                                          className={`text-center py-2 cursor-pointer hover:bg-gray-800 text-white font-semibold transition-colors min-h-[36px] flex items-center justify-center text-sm ${
                                            isSelected ? 'bg-black text-lime-500 border border-lime-500 rounded-lg font-bold' : ''
                                          }`}
                                          onClick={() => {
                                            const currentMinutes = selectedTime.split(':')[1]
                                            const currentHour24 = parseInt(selectedTime.split(':')[0])
                                            const isCurrentlyPM = currentHour24 >= 12
                                            let newHour24 = hour
                                            if (isCurrentlyPM && hour !== 12) newHour24 = hour + 12
                                            if (!isCurrentlyPM && hour === 12) newHour24 = 0
                                            setSelectedTime(`${newHour24.toString().padStart(2, '0')}:${currentMinutes}`)
                                          }}
                                        >
                                          {hour}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-gray-400 text-xl">:</div>
                              
                              {/* Minutes */}
                              <div className="flex flex-col items-center">
                                <div className="text-sm text-white mb-2">Minute</div>
                                <div className="h-28 w-12 sm:w-14 overflow-y-auto scrollbar-hide">
                                  <div className="py-2">
                                    {Array.from({ length: 60 }, (_, i) => i).map((minute) => {
                                      const currentMinute = parseInt(selectedTime.split(':')[1])
                                      const isSelected = currentMinute === minute
                                      return (
                                        <div
                                          key={minute}
                                          className={`text-center py-1.5 cursor-pointer hover:bg-gray-800 text-xs text-white transition-colors min-h-[32px] flex items-center justify-center ${
                                            isSelected ? 'bg-black text-white border border-lime-500 rounded-lg font-semibold text-sm' : ''
                                          }`}
                                          onClick={() => {
                                            const currentHour = selectedTime.split(':')[0]
                                            setSelectedTime(`${currentHour}:${minute.toString().padStart(2, '0')}`)
                                          }}
                                        >
                                          {minute.toString().padStart(2, '0')}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-gray-400 text-xl">:</div>
                              
                              {/* AM/PM */}
                              <div className="flex flex-col items-center">
                                <div className="text-sm text-white mb-2">AM/PM</div>
                                <div className="h-28 w-12 sm:w-14 overflow-y-auto scrollbar-hide">
                                  <div className="py-2">
                                    {['AM', 'PM'].map((period) => {
                                      const currentHour = parseInt(selectedTime.split(':')[0])
                                      const isCurrentlyPM = currentHour >= 12
                                      const isSelected = (period === 'PM' && isCurrentlyPM) || (period === 'AM' && !isCurrentlyPM)
                                      return (
                                        <div
                                          key={period}
                                          className={`text-center py-3 cursor-pointer hover:bg-gray-800 text-white transition-colors min-h-[40px] flex items-center justify-center text-sm ${
                                            isSelected ? 'bg-black text-white border border-lime-500 rounded-lg font-medium text-base' : ''
                                          }`}
                                          onClick={() => {
                                            const [hours, minutes] = selectedTime.split(':').map(Number)
                                            let newHour = hours
                                            if (period === 'PM' && hours < 12) {
                                              newHour = hours + 12
                                            } else if (period === 'AM' && hours >= 12) {
                                              newHour = hours - 12
                                            }
                                            setSelectedTime(`${newHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
                                          }}
                                        >
                                          {period}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Event description"
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEventModalOpen(false)}
                className="flex-1"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateEvent}
                className="text-black flex-1"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Important Dates Modal */}
      <Dialog open={isImportantDateModalOpen} onOpenChange={setIsImportantDateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Set {selectedImportantDateType?.label}
            </DialogTitle>
            <DialogDescription>
              Select a date for {selectedImportantDateType?.label?.toLowerCase()} for {leadName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedImportantDate}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setSelectedImportantDate(date)
                  }}
                  classNames={{
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsImportantDateModalOpen(false)}
                className="flex-1"
                disabled={isUpdatingImportantDate || isDeletingImportantDate}
              >
                Cancel
              </Button>
              {selectedImportantDateType && getImportantDateFromMetadata(selectedImportantDateType.key) && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteImportantDate}
                  className="flex-1 flex items-center gap-2"
                  disabled={isUpdatingImportantDate || isDeletingImportantDate}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeletingImportantDate ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button
                onClick={handleSaveImportantDate}
                className="flex-1"
                disabled={isUpdatingImportantDate || isDeletingImportantDate || !selectedImportantDate}
              >
                {isUpdatingImportantDate ? "Saving..." : "Save Date"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Email Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Send Reminder Email?
            </DialogTitle>
            <DialogDescription>
              {lastScheduledInfo && (
                <span>
                  {lastScheduledInfo.eventType.label} scheduled for {format(lastScheduledInfo.scheduledDate, 'MMM d, yyyy')} at {lastScheduledInfo.formattedTime}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsReminderDialogOpen(false)} disabled={isSendingReminder}>
              No Thanks
            </Button>
            <Button className="flex-1" onClick={handleSendReminderEmail} disabled={isSendingReminder}>
              {isSendingReminder ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar Iframe Dialog */}
      <Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen}>
        <DialogContent className="w-full max-w-4xl h-[80vh] p-0 overflow-hidden">
          <iframe
            src="/calendar"
            title="Calendar"
            className="w-full h-full border-0"
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 