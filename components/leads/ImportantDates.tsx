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
import { Calendar as CalendarIcon, Clock, DollarSign, Building2, CalendarPlus, ChevronDownIcon, ExternalLink } from "lucide-react"
import { format, addHours } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { Lead } from "@prisma/client"
import type { RawGCalEvent } from "@/types/appointments"

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

  if (!lead) return null

  const leadName = [lead.firstName, lead.lastName].filter(Boolean).join(" ")
  const leadAddress = lead.address || ""
  const claimNumber = lead.claimNumber || ""
  const userEmail = session?.user?.email || ""
  
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
        
        // Format the original time the user selected (not the adjusted time)
        const userSelectedTime = selectedTime
        const [hours, minutes] = userSelectedTime.split(':').map(Number)
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const formattedUserTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
        
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

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex flex-col items-center gap-2">
            <span>Schedule To Google Calendar</span>
            {userEmail && (
              <span className="text-sm text-muted-foreground font-normal">
                ({userEmail})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {calendarEvents.map((eventData, index) => {
              const scheduledEvent = getRecentEvent(scheduledEvents[eventData.type])
              const scheduledDate = scheduledEvent ? formatEventDate(scheduledEvent) : null
              const eventCount = scheduledEvents[eventData.type]?.length || 0
              
              // Determine border color based on event status
              let borderClass = "border-border" // default no border
              if (scheduledEvent) {
                const eventDate = new Date(scheduledEvent.start?.dateTime || scheduledEvent.start?.date || '')
                const now = new Date()
                const isPastEvent = eventDate < now
                borderClass = isPastEvent ? "border-gray-500 border-2" : "border-lime-500 border-2"
              }
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleEventButtonClick(eventData)}
                  className={`h-20 sm:h-24 p-2 sm:p-4 flex flex-col items-center justify-center gap-0.5 sm:gap-1 hover:shadow-md transition-all duration-200 disabled:opacity-100 ${borderClass}`}
                  disabled={!userEmail || isLoading || isCreating}
                >
                  <div className="flex-shrink-0">
                    {eventData.icon}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight text-white disabled:text-white px-1">
                    {eventData.label}
                  </span>
                  {scheduledDate && (
                    <span className="text-sm sm:text-base text-white disabled:text-white text-center leading-tight mt-0.5 sm:mt-1 font-semibold">
                      {scheduledDate}
                    </span>
                  )}
                  {eventCount > 0 && !scheduledDate && (
                    <span className="text-[9px] sm:text-[10px] text-white disabled:text-white text-center leading-tight mt-0.5 sm:mt-1">
                      {eventCount} scheduled
                    </span>
                  )}
                  {eventCount > 1 && scheduledDate && (
                    <span className="text-[9px] sm:text-[10px] text-white disabled:text-white text-center leading-tight">
                      +{eventCount - 1} more
                    </span>
                  )}
                  {(isLoading || isCreating) && (
                    <div className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-2 w-2 sm:h-3 sm:w-3 border-b-2 border-primary"></div>
                      <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                        {isCreating ? "Creating..." : "Loading..."}
                      </span>
                    </div>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
    </>
  )
} 