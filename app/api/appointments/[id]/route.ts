import { NextResponse } from "next/server"
import type { CalendarAppointment } from "@/types/appointments"

// Access the storedAppointments from the parent API handlers
// This is a hack for our demo - in a real app, you'd use a database
declare global {
  // eslint-disable-next-line no-var
  var storedAppointments: CalendarAppointment[];
}

// If storedAppointments is undefined, this means it's the first access
if (typeof global.storedAppointments === 'undefined') {
  global.storedAppointments = [];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { message: "Appointment ID is required" },
        { status: 400 }
      );
    }
    
    // Find the appointment
    const appointment = global.storedAppointments.find(a => a.id === id);
    
    if (!appointment) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    return NextResponse.json(appointment);
  } catch (error: unknown) {
    console.error("Error fetching appointment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { message: "Failed to fetch appointment", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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