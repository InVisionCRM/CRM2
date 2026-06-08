"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { format, parseISO, isAfter, startOfDay } from "date-fns"
import { 
  isToday, 
  isThisWeek, 
  isThisMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addDays
} from "date-fns"
import { CalendarView } from "@/components/calendar-view"

interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  allDay?: boolean
  location?: string
  description?: string
  attendees?: string[]
}

type ViewType = 'daily' | 'weekly' | 'monthly' | 'calendar'

interface CarouselCard {
  id: ViewType
  title: string
  description: string
}

export function UpcomingEvents() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentCard, setCurrentCard] = useState<ViewType>('daily')

  const cards: CarouselCard[] = [
    { id: 'daily', title: 'Today', description: 'Events for today' },
    { id: 'weekly', title: 'This Week', description: 'Next 7 days' },
    { id: 'monthly', title: `${format(new Date(), 'MMMM')}`, description: 'This month' },
    { id: 'calendar', title: 'Calendar', description: 'Full calendar view' },
  ]

  useEffect(() => {
    if (session?.user) {
      fetchUpcomingEvents()
    }
  }, [session])

  const fetchUpcomingEvents = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch events from Google Calendar API
      const response = await fetch('/api/calendar/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch events from Google Calendar')
      }

      const data = await response.json()
      
      // Events are already filtered on the backend
      const upcomingEvents = data.events
        ?.filter((event: CalendarEvent) => {
          const eventStart = new Date(event.startTime)
          return isAfter(eventStart, new Date())
        })
        .sort((a: CalendarEvent, b: CalendarEvent) => {
          const aStart = new Date(a.startTime)
          const bStart = new Date(b.startTime)
          return aStart.getTime() - bStart.getTime()
        })

      setEvents(upcomingEvents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredEvents = (type: ViewType): CalendarEvent[] => {
    const now = new Date()
    
    switch (type) {
      case 'daily':
        return events.filter(event => {
          const eventDate = new Date(event.startTime)
          return isToday(eventDate)
        })
      case 'weekly':
        return events.filter(event => {
          const eventDate = new Date(event.startTime)
          return eventDate >= now && eventDate <= addDays(now, 7)
        })
      case 'monthly':
        return events.filter(event => {
          const eventDate = new Date(event.startTime)
          return isThisMonth(eventDate) && eventDate >= now
        })
      default:
        return []
    }
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today'
    } else if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Tomorrow'
    } else {
      return format(date, 'MMM d')
    }
  }

  const formatEventTime = (startTime: string, endTime: string, allDay?: boolean) => {
    if (allDay) {
      return 'All day'
    }
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
  }

  const nextCard = () => {
    const currentIndex = cards.findIndex(card => card.id === currentCard)
    const nextIndex = (currentIndex + 1) % cards.length
    setCurrentCard(cards[nextIndex].id)
  }

  const prevCard = () => {
    const currentIndex = cards.findIndex(card => card.id === currentCard)
    const prevIndex = currentIndex === 0 ? cards.length - 1 : currentIndex - 1
    setCurrentCard(cards[prevIndex].id)
  }

  const renderCalendarView = () => {
    // Get calendar credentials from session
    const credentials = session?.accessToken ? {
      accessToken: session.accessToken as string,
      refreshToken: session.refreshToken as string,
    } : undefined

    return (
      <div className="w-full h-80 sm:h-96 rounded-lg overflow-hidden">
        <div className="transform scale-50 origin-top-left w-[200%] h-[200%]">
          <CalendarView 
            credentials={credentials}
          />
        </div>
      </div>
    )
  }

  const renderEventsList = (filteredEvents: CalendarEvent[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5AD2F4]"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-[#EF5E73] text-sm text-center py-4">
          {error}
        </div>
      )
    }

    if (filteredEvents.length === 0) {
      return (
        <div className="text-[#A7B0A6] text-sm text-center py-8">
          No events found for this period
        </div>
      )
    }

    return (
      <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto pr-1">
        {filteredEvents.slice(0, 10).map((event) => (
          <div
            key={event.id}
            className="p-4 rounded-xl bg-[#1B231D]/70 border border-[rgba(236,234,224,0.08)] hover:border-[rgba(236,234,224,0.14)] hover:bg-[#1B231D] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-[#ECEAE0] font-semibold truncate text-sm tracking-tight">
                  {event.title}
                </h4>
                {event.description && (
                  <p className="text-[#A7B0A6] text-xs mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-[#A7B0A6]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#5AD2F4]" />
                    {formatEventDate(event.startTime)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#A7B0A6]" />
                    {formatEventTime(event.startTime, event.endTime, event.allDay)}
                  </div>
                  {event.location && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#A7B0A6]" />
                        <span className="text-[#A7B0A6] text-xs">{event.location}</span>
                      </div>
                      <a
                        href={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5AD2F4] hover:text-[#5AD2F4]/80 text-xs underline ml-4 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Get Directions
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const currentCardData = cards.find(card => card.id === currentCard)
  const filteredEvents = getFilteredEvents(currentCard)

  const getEventCount = (type: ViewType): number => {
    return getFilteredEvents(type).length
  }

  return (
    <Card className="bg-gradient-to-b from-[#161D18] to-[#131815]/60 border-[rgba(236,234,224,0.08)] rounded-2xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md">
      <CardHeader className="pb-3 border-b border-[rgba(236,234,224,0.08)]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#ECEAE0] flex items-center gap-2 text-base font-bold tracking-tight">
            <Calendar className="w-5 h-5 text-[#5AD2F4]" />
            {currentCardData?.title}
            {currentCard !== 'calendar' && (
              <span className="text-xs text-[#6E776E] font-medium">
                ({filteredEvents.length})
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={prevCard}
              className="p-1 text-[#A7B0A6] hover:text-[#ECEAE0] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {cards.map((card, index) => (
                <div key={card.id} className="relative group">
                  <button
                    onClick={() => setCurrentCard(card.id)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      currentCard === card.id
                        ? 'bg-[#A4D65E] ring-2 ring-[#A4D65E]/25 scale-110'
                        : 'bg-[#6E776E]/60 hover:bg-[#A7B0A6]'
                    }`}
                    title={card.title}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#0F1311] text-[#ECEAE0] text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10 border border-[rgba(236,234,224,0.14)]">
                    {card.title}
                    {card.id !== 'calendar' && (
                      <span className="ml-1 text-[#5AD2F4]">
                        ({getEventCount(card.id)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={nextCard}
              className="p-1 text-[#A7B0A6] hover:text-[#ECEAE0] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[#6E776E] text-xs mt-1">{currentCardData?.description}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-5">
        {currentCard === 'calendar' ? renderCalendarView() : renderEventsList(filteredEvents)}

        {currentCard !== 'calendar' && !loading && !error && events.length > 0 && (
          <button
            onClick={fetchUpcomingEvents}
            className="w-full text-xs font-medium text-[#5AD2F4] hover:text-[#5AD2F4]/80 py-2 transition-colors"
          >
            Refresh Events
          </button>
        )}
      </CardContent>
    </Card>
  )
} 