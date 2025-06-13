import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { CalendarAppointment } from '@/types/appointments';
import { addHours, format } from 'date-fns';

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  try {
    console.log('Refreshing Google access token...');
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Successfully refreshed access token');
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function makeCalendarRequest(url: string, options: RequestInit, accessToken: string, refreshToken?: string): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401 && refreshToken) {
    console.log('Token expired, attempting refresh...');
    const newToken = await refreshGoogleToken(refreshToken);
    if (newToken) {
      // Retry with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Calendar API error: ${retryResponse.status}`);
      }
      
      return retryResponse.json();
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Calendar API error: ${response.status}`);
  }

  return response.json();
}

function createGoogleCalendarEvent(appointment: CalendarAppointment) {
  if (!appointment.date) {
    throw new Error('Appointment date is required');
  }

  const startDate = appointment.date;
  const endDate = addHours(startDate, 1);

  return {
    summary: appointment.title,
    description: appointment.notes,
    location: appointment.address,
    start: {
      dateTime: startDate.toISOString(),
    },
    end: {
      dateTime: endDate.toISOString(),
    },
    extendedProperties: {
      private: {
        leadId: appointment.leadId,
        leadName: appointment.leadName,
        purpose: appointment.purpose,
        status: appointment.status,
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      startDateTime, 
      endDateTime, 
      leadId, 
      leadName, 
      eventType, 
      location 
    } = body;

    if (!title || !startDateTime || !leadId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDateTime, leadId' },
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

    // Create the appointment object with original times for UI display
    const originalStartDate = new Date(startDateTime);
    const originalEndDate = endDateTime ? new Date(endDateTime) : addHours(originalStartDate, 1);

    // Subtract 4 hours from the times before sending to Google Calendar API
    const adjustedStartDate = addHours(originalStartDate, -4);
    const adjustedEndDate = addHours(originalEndDate, -4);

    console.log('Time adjustment:', {
      originalTime: originalStartDate.toISOString(),
      adjustedTime: adjustedStartDate.toISOString(),
      difference: '4 hours subtracted'
    });

    const appointment: CalendarAppointment = {
      id: '',
      title,
      date: adjustedStartDate, // Use adjusted time for Google Calendar API
      startTime: format(adjustedStartDate, 'HH:mm'),
      endTime: format(adjustedEndDate, 'HH:mm'),
      notes: description || '',
      purpose: 'ADJUSTER',
      status: 'SCHEDULED',
      leadId,
      leadName: leadName || '',
      address: location || '',
    };

    const googleEvent = createGoogleCalendarEvent(appointment);

    const event = await makeCalendarRequest(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`,
      {
        method: 'POST',
        body: JSON.stringify(googleEvent),
      },
      accessToken,
      refreshToken
    );

    console.log('Google Calendar event created:', {
      eventId: event.id,
      htmlLink: event.htmlLink,
      summary: event.summary,
      originalStartTime: originalStartDate.toISOString(),
      adjustedStartTime: adjustedStartDate.toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      event,
      eventUrl: event.htmlLink,
      originalStartTime: originalStartDate.toISOString(),
      adjustedStartTime: adjustedStartDate.toISOString(),
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create calendar event', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 