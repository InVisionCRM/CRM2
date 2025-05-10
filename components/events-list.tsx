"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
// import { useEvents } from "@/hooks/use-events"
import { format, parseISO, isValid } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Trash2, Edit } from "lucide-react"
import Link from "next/link"
// import { deleteEvent } from "@/lib/google-calendar" // Removed direct import
import { GoogleCalendarService } from "@/lib/services/googleCalendar" // Added service import
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { EventTooltip } from "@/components/event-tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import type { RawGCalEvent } from "@/types/appointments"; // Import RawGCalEvent

export function EventsList() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // const { events, isLoading, mutate } = useEvents(session?.accessToken as string, new Date())
  // TODO: Replace with actual event fetching logic if useEvents is unavailable or different
  // const events: any[] = [] // Placeholder
  const [events, setEvents] = useState<RawGCalEvent[]>([]); // Use RawGCalEvent[]
  // const isLoading = true // Placeholder
  const [isLoading, setIsLoading] = useState(false); 
  const mutate = () => {} // Placeholder

  const handleDelete = async (eventId: string | undefined) => {
    if (!eventId) {
      toast({
        title: "Error",
        description: "Cannot delete event without an ID.",
        variant: "destructive",
      });
      return;
    }

    const eventToDelete = events.find(e => e.id === eventId);
    const currentEventTitle = eventToDelete?.summary || "Selected Event";

    if (!confirm(`Are you sure you want to delete "${currentEventTitle}"?`)) {
      return
    }
    if (!session?.accessToken) {
      toast({
        title: "Error",
        description: "Authentication required to delete event.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(eventId)

    try {
      const calendarService = new GoogleCalendarService({ accessToken: session.accessToken })
      await calendarService.deleteEvent(eventId)
      setIsDeleting(null)
      toast({
        title: "Event Deleted Successfully",
        description: `Event "${currentEventTitle}" has been removed.`,
      })
      mutate()
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
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
          Loading your events...
        </motion.p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <motion.div
        className="bg-white rounded-lg shadow p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No events found</h3>
        <p className="text-gray-500 mb-4">You don't have any upcoming events.</p>
        <Link href="/dashboard/events/new">
          <Button>Create New Event</Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <TooltipProvider>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <AnimatePresence>
          <div className="divide-y">
            {events.map((event, index) => {
              const startDate = event.start?.dateTime
                ? parseISO(event.start.dateTime)
                : event.start?.date
                  ? parseISO(event.start.date)
                  : null

              const endDate = event.end?.dateTime
                ? parseISO(event.end.dateTime)
                : event.end?.date
                  ? parseISO(event.end.date)
                  : null

              const isAllDay = !event.start?.dateTime

              return (
                <motion.div
                  key={event.id}
                  className="p-4 hover:bg-gray-50 transition-colors duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <EventTooltip event={event}>
                      <div className="flex-1 cursor-pointer transition-transform hover:scale-[1.01] duration-200">
                        <h3 className="font-medium text-lg">{event.summary || "Untitled Event"}</h3>

                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {startDate && isValid(startDate) ? (
                              <>
                                {format(startDate, "EEEE, MMMM d, yyyy")}
                                {isAllDay && " (All day)"}
                              </>
                            ) : (
                              "Date not available"
                            )}
                          </div>

                          {!isAllDay && startDate && endDate && isValid(startDate) && isValid(endDate) && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                            </div>
                          )}

                          {event.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </EventTooltip>

                    <div className="flex space-x-2 self-end md:self-center">
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="transition-all duration-200 hover:shadow-md"
                          disabled={!event.id}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        disabled={isDeleting === event.id || !event.id}
                        className="transition-all duration-200 hover:shadow-md hover:border-red-300"
                      >
                        {isDeleting === event.id ? (
                          <motion.div
                            className="rounded-full h-4 w-4 border-b-2 border-primary"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
