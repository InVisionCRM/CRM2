import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleCalendarService } from '@/lib/services/googleCalendar';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get access token and refresh token from session
    const accessToken = session.accessToken as string;
    const refreshToken = session.refreshToken as string;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const calendarService = new GoogleCalendarService({
      accessToken,
      refreshToken
    });

    // Get events from the past month and next month
    const now = new Date();
    const timeMin = startOfMonth(addMonths(now, -1));
    const timeMax = endOfMonth(addMonths(now, 1));

    console.log('🔍 Fetching events from:', timeMin.toISOString(), 'to:', timeMax.toISOString());

    const events = await calendarService.listEvents(timeMin, timeMax);

    console.log('🔍 Total events found:', events.length);

    // Return detailed information about each event
    const debugEvents = events.map((event, index) => ({
      index: index + 1,
      id: event.id,
      summary: event.summary,
      description: event.description ? 
        (event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description) : 
        undefined,
      start: event.start,
      extendedProperties: event.extendedProperties,
      location: event.location
    }));

    return NextResponse.json({
      userEmail: session.user.email,
      totalEvents: events.length,
      searchPeriod: {
        from: timeMin.toISOString(),
        to: timeMax.toISOString()
      },
      events: debugEvents
    });

  } catch (error) {
    console.error('Error in debug events endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 