import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { startOfMonth, endOfMonth, addMonths, addHours } from 'date-fns';
import type { RawGCalEvent } from '@/types/appointments';

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

// Function to process events without time adjustment (events now stored with original user times)
function processEventForUI(event: RawGCalEvent): RawGCalEvent {
  // Return event as-is since times are now stored correctly
  return { ...event };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const leadName = searchParams.get('leadName');

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    // Get access token and refresh token from session
    const accessToken = session.accessToken as string;
    const refreshToken = session.refreshToken as string;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    // Search for events in the past 6 months and next 6 months
    const now = new Date();
    const timeMin = startOfMonth(addMonths(now, -6));
    const timeMax = endOfMonth(addMonths(now, 6));

    const params = new URLSearchParams({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await makeCalendarRequest(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?${params}`,
      { method: 'GET' },
      accessToken,
      refreshToken
    );

    const events: RawGCalEvent[] = response.items || [];

    // Filter events that contain the lead information in title, description, or extended properties
    const leadEvents = events.filter(event => {
      // Check extended properties first (most reliable)
      if (event.extendedProperties?.private?.leadId === leadId) {
        return true;
      }

      // Check if the lead name is in the event summary/title
      if (leadName && event.summary?.toLowerCase().includes(leadName.toLowerCase())) {
        return true;
      }

      // Check if the leadId is mentioned in the description
      if (event.description?.includes(leadId)) {
        return true;
      }

      return false;
    });

    // Process events (no time adjustment needed - events stored with original user times)
    const processedLeadEvents = leadEvents.map(processEventForUI);

    // Categorize events by type based on title keywords
    const categorizedEvents: {
      adjuster: RawGCalEvent[];
      build: RawGCalEvent[];
      acv: RawGCalEvent[];
      rcv: RawGCalEvent[];
    } = {
      adjuster: [],
      build: [],
      acv: [],
      rcv: []
    };

    processedLeadEvents.forEach(event => {
      const title = event.summary?.toLowerCase() || '';
      if (title.includes('adjuster')) {
        categorizedEvents.adjuster.push(event);
      } else if (title.includes('build')) {
        categorizedEvents.build.push(event);
      } else if (title.includes('acv')) {
        categorizedEvents.acv.push(event);
      } else if (title.includes('rcv')) {
        categorizedEvents.rcv.push(event);
      }
    });

    return NextResponse.json({
      ...categorizedEvents,
      userEmail: session.user.email // Include user email for account verification
    });

  } catch (error) {
    console.error('Error fetching lead calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 