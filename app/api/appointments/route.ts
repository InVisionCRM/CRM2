import { NextResponse } from "next/server"
import type { CalendarAppointment, AppointmentFormData, AppointmentPurpose } from "@/types/appointments"
import { addDays, addHours, parseISO, startOfDay } from "date-fns"

// Global storage for appointments (will reset on server restart)
declare global {
  var storedAppointments: CalendarAppointment[];
}

// Initialize the global appointments array if not already done
if (typeof global.storedAppointments === 'undefined') {
  global.storedAppointments = [];
}

// Mock data generator for appointments
function generateMockAppointments(startDate: Date, endDate: Date, leadId?: string): CalendarAppointment[] {
  const appointments: CalendarAppointment[] = []

  // Use the correct appointment purposes
  const appointmentPurposes: AppointmentPurpose[] = [
    "adjuster_appointment",
    "pick_up_check",
    "build_day",
    "meeting_with_client",
  ]

  const statuses = ["scheduled", "completed", "cancelled", "rescheduled"]

  // Generate some random appointments within the date range
  const start = startOfDay(startDate)
  const end = endDate
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  // Generate between 5-15 appointments
  const numAppointments = Math.min(daysDiff * 2, 15)

  for (let i = 0; i < numAppointments; i++) {
    const randomDayOffset = Math.floor(Math.random() * daysDiff)
    const appointmentDate = addDays(start, randomDayOffset)

    // Random hour between 8 AM and 5 PM
    const hour = 8 + Math.floor(Math.random() * 10)
    appointmentDate.setHours(hour, 0, 0, 0)

    const endTime = addHours(appointmentDate, 1 + Math.floor(Math.random() * 2))

    // Select a random purpose from our defined purposes
    const purpose = appointmentPurposes[Math.floor(Math.random() * appointmentPurposes.length)]

    const appointment: CalendarAppointment = {
      id: `appt-${i}-${Date.now()}`,
      title: purpose.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      startTime: appointmentDate.toISOString(),
      endTime: endTime.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      leadId: leadId || `lead-${Math.floor(Math.random() * 10) + 1}`,
      leadName: `Customer ${Math.floor(Math.random() * 100) + 1}`,
      address: `${Math.floor(Math.random() * 9000) + 1000} Main St, City, State`,
      notes: Math.random() > 0.5 ? "Some notes about this appointment" : "",
      purpose: purpose,
    }

    appointments.push(appointment)
  }

  // If leadId is provided, ensure at least 2 appointments for that lead
  if (leadId) {
    const leadAppointments = appointments.filter((a) => a.leadId === leadId)
    if (leadAppointments.length < 2) {
      const additionalNeeded = 2 - leadAppointments.length
      for (let i = 0; i < additionalNeeded; i++) {
        const randomDayOffset = Math.floor(Math.random() * daysDiff)
        const appointmentDate = addDays(start, randomDayOffset)

        // Random hour between 8 AM and 5 PM
        const hour = 8 + Math.floor(Math.random() * 10)
        appointmentDate.setHours(hour, 0, 0, 0)

        const endTime = addHours(appointmentDate, 1)

        // Select a random purpose
        const purpose = appointmentPurposes[Math.floor(Math.random() * appointmentPurposes.length)]

        const appointment: CalendarAppointment = {
          id: `lead-specific-${i}-${Date.now()}`,
          title: purpose.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          startTime: appointmentDate.toISOString(),
          endTime: endTime.toISOString(),
          status: "scheduled",
          leadId: leadId,
          leadName: `Customer for Lead ${leadId}`,
          address: `${Math.floor(Math.random() * 9000) + 1000} Client St, City, State`,
          notes: "Lead-specific appointment",
          purpose: purpose,
        }

        appointments.push(appointment)
      }
    }
  }

  return appointments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const leadId = searchParams.get("leadId") || undefined

    // Default to current week if no dates provided
    const startDate = startDateParam ? parseISO(startDateParam) : startOfDay(new Date())
    const endDate = endDateParam ? parseISO(endDateParam) : addDays(startDate, 7)

    // If there are no stored appointments yet, generate mock data and store it
    if (global.storedAppointments.length === 0) {
      global.storedAppointments = generateMockAppointments(
        startOfDay(new Date()),
        addDays(startOfDay(new Date()), 30)
      );
    }
    
    // Get appointments from global storage
    let appointments = [...global.storedAppointments];
    
    // Filter by leadId if provided
    if (leadId) {
      appointments = appointments.filter(appt => appt.leadId === leadId);
    }
    
    // Filter by date range
    appointments = appointments.filter(appt => {
      const apptDate = new Date(appt.startTime);
      return apptDate >= startDate && apptDate <= endDate;
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(appointments)
  } catch (error: unknown) {
    console.error("Error fetching appointments:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ message: "Failed to fetch appointments", error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("Received POST request to /api/appointments");
    const data = await request.json();
    console.log("Appointment data received:", JSON.stringify(data));
    
    // Validate required fields with better error messages
    const missingFields = [];
    if (!data.title) missingFields.push("title");
    if (!data.date) missingFields.push("date");
    if (!data.startTime) missingFields.push("startTime");
    if (!data.endTime) missingFields.push("endTime");
    if (!data.purpose) missingFields.push("purpose");
    if (!data.clientId) missingFields.push("clientId");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          message: "Missing required fields", 
          details: `Missing: ${missingFields.join(", ")}` 
        },
        { status: 400 }
      );
    }
    
    try {
      // Format date and times for storage
      let appointmentDate: Date;
      
      // Handle different date formats
      if (data.date instanceof Date) {
        appointmentDate = new Date(data.date);
      } else if (typeof data.date === 'string') {
        appointmentDate = new Date(data.date);
      } else if (typeof data.date === 'object' && data.date !== null) {
        // Handle stringified date object
        appointmentDate = new Date(data.date);
      } else {
        throw new Error("Invalid date format");
      }
      
      // Extract hour and minute from startTime (format: "10:00 AM")
      const [startTimeStr, startPeriod] = data.startTime.split(" ");
      const [startHour, startMinute] = startTimeStr.split(":").map(Number);
      
      // Convert to 24-hour format
      let hour24 = startHour;
      if (startPeriod === "PM" && startHour !== 12) {
        hour24 = startHour + 12;
      } else if (startPeriod === "AM" && startHour === 12) {
        hour24 = 0;
      }
      
      // Set the time on the appointment date
      appointmentDate.setHours(hour24, startMinute, 0, 0);
      
      // Calculate end time
      const [endTimeStr, endPeriod] = data.endTime.split(" ");
      const [endHour, endMinute] = endTimeStr.split(":").map(Number);
      
      // Convert to 24-hour format
      let endHour24 = endHour;
      if (endPeriod === "PM" && endHour !== 12) {
        endHour24 = endHour + 12;
      } else if (endPeriod === "AM" && endHour === 12) {
        endHour24 = 0;
      }
      
      const endDate = new Date(appointmentDate);
      endDate.setHours(endHour24, endMinute, 0, 0);
      
      // Create an appointment with the provided data
      const newAppointment: CalendarAppointment = {
        id: `appt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: data.title,
        date: appointmentDate,
        startTime: appointmentDate.toISOString(),
        endTime: endDate.toISOString(),
        status: data.status || "scheduled",
        leadId: data.clientId,
        leadName: data.title.includes("with") ? data.title.split("with")[1].trim() : "Client",
        address: data.address || "",
        notes: data.notes || "",
        purpose: data.purpose,
      };
      
      console.log("Created appointment object:", JSON.stringify(newAppointment));
      
      // Add to stored appointments
      global.storedAppointments.push(newAppointment);
      console.log("Appointment added to storage. Total appointments:", global.storedAppointments.length);
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      return NextResponse.json(newAppointment, { status: 201 });
    } catch (error) {
      console.error("Error processing appointment data:", error);
      return NextResponse.json(
        { 
          message: "Error processing appointment data", 
          error: error instanceof Error ? error.message : "Unknown error" 
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error creating appointment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: "Failed to create appointment", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    
    if (!id) {
      return NextResponse.json(
        { message: "Appointment ID is required" },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Find the appointment to update
    const appointmentIndex = global.storedAppointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }
    
    // Update the appointment
    const updatedAppointment = {
      ...global.storedAppointments[appointmentIndex],
      ...data,
    };
    
    global.storedAppointments[appointmentIndex] = updatedAppointment;
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return NextResponse.json(updatedAppointment);
  } catch (error: unknown) {
    console.error("Error updating appointment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: "Failed to update appointment", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];
    
    if (!id) {
      return NextResponse.json(
        { message: "Appointment ID is required" },
        { status: 400 }
      );
    }
    
    // Find the appointment to delete
    const appointmentIndex = global.storedAppointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }
    
    // Remove the appointment
    global.storedAppointments.splice(appointmentIndex, 1);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting appointment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: "Failed to delete appointment", error: errorMessage },
      { status: 500 }
    );
  }
}
