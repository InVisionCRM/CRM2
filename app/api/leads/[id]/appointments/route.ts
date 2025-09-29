import { NextResponse } from "next/server"
import type { CalendarAppointment } from "@/types/appointments"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Access the storedAppointments from the parent API handlers
declare global {
  // eslint-disable-next-line no-var
  var storedAppointments: CalendarAppointment[];
}

// Initialize if needed
if (typeof global.storedAppointments === 'undefined') {
  global.storedAppointments = [];
}

// Get appointments for a lead
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const appointments = await prisma.appointment.findMany({
      where: { leadId: id },
      orderBy: { scheduledFor: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}

// Create appointment for a lead
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get appointment data from request
    const data = await request.json();
    console.log(`Received appointment data for lead ${id}:`, JSON.stringify(data));
    
    // Ensure the appointment is associated with this lead
    data.clientId = id;
    
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