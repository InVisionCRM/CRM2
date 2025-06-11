// app/api/calendar/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleCalendarService } from '@/lib/services/googleCalendar';
import type { CalendarAppointment } from "@/types/appointments";
import { AppointmentPurposeEnum } from "@/types/appointments";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
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
