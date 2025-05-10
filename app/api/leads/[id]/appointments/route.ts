import { NextResponse } from "next/server"
import type { CalendarAppointment } from "@/types/appointments"

// Access the storedAppointments from the parent API handlers
declare global {
  // eslint-disable-next-line no-var
  var storedAppointments: CalendarAppointment[];
}

// Initialize if needed
if (typeof global.storedAppointments === 'undefined') {
  global.storedAppointments = [];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    
    if (!leadId) {
      return NextResponse.json(
        { message: "Lead ID is required" },
        { status: 400 }
      );
    }
    
    // Get appointments for this lead
    const appointments = global.storedAppointments.filter(a => a.leadId === leadId);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    return NextResponse.json(appointments);
  } catch (error: unknown) {
    console.error("Error fetching lead appointments:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: "Failed to fetch lead appointments", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    
    if (!leadId) {
      return NextResponse.json(
        { message: "Lead ID is required" },
        { status: 400 }
      );
    }
    
    // Get appointment data from request
    const data = await request.json();
    console.log(`Received appointment data for lead ${leadId}:`, JSON.stringify(data));
    
    // Ensure the appointment is associated with this lead
    data.clientId = leadId;
    
    // Forward to the main appointments endpoint
    const response = await fetch(new URL('/api/appointments', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    return NextResponse.json(result, { status: response.ok ? 201 : 400 });
  } catch (error: unknown) {
    console.error("Error creating lead appointment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: "Failed to create lead appointment", error: errorMessage },
      { status: 500 }
    );
  }
} 