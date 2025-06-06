// app/api/calendar/events/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleCalendarService } from "@/lib/services/googleCalendar";
import type { CalendarAppointment } from "@/types/appointments";
import { AppointmentPurposeEnum } from "@/types/appointments";

export async function POST(request: Request) {
  try {
    // 1) Verify the user session + access token
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2) Parse the JSON body
    const data = await request.json();
    //    We expect fields like:
    //    {
    //      summary: string,
    //      description: string,
    //      location: string,
    //      startTime: string,   // ISO timestamp, e.g. "2025-06-06T10:00:00"
    //      endTime: string,     // ISO timestamp, e.g. "2025-06-06T11:00:00"
    //      purpose: string,     // e.g. "ADJUSTER"
    //      status: string,      // e.g. "SCHEDULED"
    //      leadId: string,
    //      leadName?: string
    //    }

    // 3) Build a CalendarAppointment object out of the incoming JSON
    //    so that GoogleCalendarService.createEvent() sees the correct shape.
    const {
      summary,
      description,
      location,
      startTime: rawStart,
      endTime: rawEnd,
      purpose,
      status,
      leadId,
      leadName,
      timeZone,
    } = data;

    // Validate required fields
    if (!summary || !rawStart || !rawEnd || !purpose || !status || !leadId) {
      return new NextResponse("Missing required appointment fields", { status: 400 });
    }

    // Convert the incoming ISO timestamps to a JS Date, then extract date + HH:mm for CalendarAppointment
    const startDateObj = new Date(rawStart);
    const endDateObj = new Date(rawEnd);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return new NextResponse("Invalid startTime or endTime", { status: 400 });
    }

    // Format date portion as “YYYY-MM-DD”
    const yyyy = startDateObj.getFullYear();
    const mm = String(startDateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(startDateObj.getDate()).padStart(2, "0");
    const dateOnly = `${yyyy}-${mm}-${dd}`;

    // Extract “HH:mm” from each Date
    const pad2 = (num: number) => String(num).padStart(2, "0");
    const startHHmm = `${pad2(startDateObj.getHours())}:${pad2(startDateObj.getMinutes())}`;
    const endHHmm   = `${pad2(endDateObj.getHours())}:${pad2(endDateObj.getMinutes())}`;

    // Build the CalendarAppointment shape:
    const appointment: CalendarAppointment = {
      // NOTE: if you store your Google event's “id” somewhere, fill it here.
      // For a newly created event, you can leave `id` blank or omit it; service will return a new one.
      id: "",

      title: summary,
      date: new Date(dateOnly),          // Just “2025-06-06” as a Date
      startTime: startHHmm,              // “10:00”
      endTime: endHHmm,                  // “11:00”
      notes: description || "",
      purpose: purpose as AppointmentPurposeEnum,
      status: status,
      leadId,
      leadName: leadName || "",
      address: location || "",
      timeZone: timeZone || "America/New_York",
    };

    // 4) Instantiate the calendar service and call createEvent
    const calendarService = new GoogleCalendarService({
      accessToken: session.accessToken,
      // If you track/need a refreshToken, include it here as well:
      // refreshToken: session.refreshToken ?? null,
    });

    const createdEvent = await calendarService.createEvent(appointment);

    // 5) Return the created Google event (RawGCalEvent) as JSON
    return NextResponse.json(createdEvent);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    const message = error instanceof Error ? error.message : "Failed to create calendar event";
    return new NextResponse(message, { status: 500 });
  }
}
