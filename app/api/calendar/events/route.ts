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
    console.log("API Route - Received data:", JSON.stringify(data, null, 2));
    
    // Validate incoming data (basic example)
    if (!data.summary || !data.startTime || !data.endTime || !data.timeZone) {
      return new NextResponse("Missing required appointment data", { status: 400 });
    }
    
    // Create Google Calendar service instance
    const calendarService = new GoogleCalendarService({
      accessToken: session.accessToken,
      // Potentially pass refreshToken if your service handles refresh
      // refreshToken: session.refreshToken 
    });

    // Prepare the appointment data for the service
    // Pass startTime and endTime as the original ISO strings from the client
    const appointmentForService: CalendarAppointment = {
      title: data.summary,
      startTime: data.startTime, // Use direct ISO string from client
      endTime: data.endTime,     // Use direct ISO string from client
      notes: data.description,
      purpose: data.purpose || AppointmentPurposeEnum.ADJUSTER, // Use purpose from data or default
      status: data.status || "SCHEDULED", // Default status if not provided
      leadId: data.leadId,
      address: data.location,
      timeZone: data.timeZone, // This is 'America/New_York' from client
      // Optional fields from CalendarAppointment that might be in 'data'
      id: data.id,
      date: data.startTime ? new Date(data.startTime) : undefined, // Keep 'date' for now if other parts of CalendarAppointment rely on it
      leadName: data.leadName,
      userId: data.userId
    };
    console.log("API Route - Appointment for service:", JSON.stringify(appointmentForService, null, 2));

    // Create the calendar event
    const event = await calendarService.createEvent(appointmentForService);

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    // Provide a more generic error message to the client
    const errorMessage = error instanceof Error ? error.message : "Failed to create calendar event";
    // Avoid exposing detailed error messages unless specifically intended for debugging
    return new NextResponse(
      JSON.stringify({ error: "An internal server error occurred while creating the calendar event.", details: errorMessage }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 