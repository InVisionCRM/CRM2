import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleCalendarService } from '@/lib/services/googleCalendar'
import { addDays, startOfDay, endOfDay } from 'date-fns'

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Google Calendar credentials from session
    const accessToken = session.accessToken
    if (!accessToken) {
      return NextResponse.json({ error: 'No Google Calendar access token' }, { status: 401 })
    }

    const calendar = new GoogleCalendarService({
      accessToken: accessToken as string,
      refreshToken: session.refreshToken as string,
    })

    // Get events from Google Calendar API
    const now = new Date()
    const timeMin = startOfDay(now)
    const timeMax = endOfDay(addDays(now, 30)) // Next 30 days

    const rawEvents = await calendar.listEvents(timeMin, timeMax)
    
    // Transform raw Google Calendar events to our format
    const events: CalendarEvent[] = rawEvents.map(event => ({
      id: event.id || '',
      title: event.summary || 'No Title',
      startTime: event.start?.dateTime || event.start?.date || '',
      endTime: event.end?.dateTime || event.end?.date || '',
      allDay: !event.start?.dateTime, // If no dateTime, it's all-day
      location: event.location,
      description: event.description,
      attendees: event.attendees?.map(a => a.email).filter(Boolean) || [],
    }))

    // Filter for upcoming events only
    const upcomingEvents = events.filter(event => {
      const eventStart = new Date(event.startTime)
      return eventStart >= now
    })

    return NextResponse.json({ 
      events: upcomingEvents,
      count: upcomingEvents.length 
    })

  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events from Google Calendar' },
      { status: 500 }
    )
  }
} 