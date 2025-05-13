import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/services/googleCalendar";
import type { CalendarAppointment } from "@/types/appointments";
import { AppointmentPurposeEnum } from "@/types/appointments";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    
    // Create Google Calendar service instance
    const calendarService = new GoogleCalendarService({
      accessToken: session.accessToken
    });

    // Format the appointment data
    const appointment: CalendarAppointment = {
      title: data.summary,
      date: new Date(data.startTime),
      startTime: new Date(data.startTime).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: new Date(data.endTime).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      notes: data.description,
      purpose: AppointmentPurposeEnum.ADJUSTER,
      status: data.status,
      leadId: data.leadId,
      address: data.location
    };

    // Create the calendar event
    const event = await calendarService.createEvent(appointment);

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to create calendar event",
      { status: 500 }
    );
  }
} 