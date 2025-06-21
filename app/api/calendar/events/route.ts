// app/api/calendar/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleCalendarService } from '@/lib/services/googleCalendar';
import type { CalendarAppointment } from "@/types/appointments";
import { AppointmentPurposeEnum } from "@/types/appointments";
import { startOfDay, endOfDay, addDays } from 'date-fns';

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('No session or user email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { summary, description, startTime, endTime, attendeeEmail, leadId, leadName } = body;

    if (!summary || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, startTime, endTime' },
        { status: 400 }
      );
    }

    // Get access token and refresh token from session
    const accessToken = session.accessToken as string;
    const refreshToken = session.refreshToken as string;

    if (!accessToken) {
      console.log('No access token found in session');
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    const calendarService = new GoogleCalendarService({
      accessToken,
      refreshToken // Enable refresh token
    });

    // Create CalendarAppointment object with the expected structure
    const appointment: CalendarAppointment = {
      id: '', // Will be set by Google Calendar
      title: summary,
      date: new Date(startTime),
      startTime: new Date(startTime).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: new Date(endTime).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      notes: description || '',
      purpose: 'ADJUSTER',
      status: 'SCHEDULED',
      leadId: leadId || '',
      leadName: leadName || '',
      address: '',
      timeZone: 'America/New_York',
    };

    const event = await calendarService.createEvent(appointment);

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Calendar event creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('No session or user email found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Google Calendar credentials from session
    const accessToken = session.accessToken
    if (!accessToken) {
      console.log('No access token found in session')
      return NextResponse.json({ error: 'No Google Calendar access token' }, { status: 401 })
    }

    console.log('Fetching calendar events for user:', session.user.email)

    const calendar = new GoogleCalendarService({
      accessToken: accessToken as string,
      refreshToken: session.refreshToken as string,
    })

    // Get events from Google Calendar API
    const now = new Date()
    const timeMin = startOfDay(now)
    const timeMax = endOfDay(addDays(now, 30)) // Next 30 days

    console.log('Fetching events from', timeMin.toISOString(), 'to', timeMax.toISOString())

    const rawEvents = await calendar.listEvents(timeMin, timeMax)
    
    console.log('Raw events fetched:', rawEvents.length)

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

    console.log('Upcoming events filtered:', upcomingEvents.length)

    return NextResponse.json({ 
      events: upcomingEvents,
      count: upcomingEvents.length 
    })

  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch events from Google Calendar',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
