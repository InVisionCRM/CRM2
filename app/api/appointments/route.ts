import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { 
  createAppointment, 
  getAppointments, 
  getAppointmentById,
  updateAppointment,
  deleteAppointment 
} from "@/lib/db/appointments"
import { AppointmentPurpose, AppointmentStatus } from "@prisma/client"
import { startOfDay, endOfDay } from "date-fns"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const leadId = searchParams.get("leadId")

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appointments = await getAppointments({
      startDate: startDate ? startOfDay(new Date(startDate)) : undefined,
      endDate: endDate ? endOfDay(new Date(endDate)) : undefined,
      leadId: leadId || undefined,
      userId: session.user.id
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const {
      title,
      startTime,
      endTime,
      purpose,
      status,
      address,
      notes,
      leadId
    } = data

    if (!title || !startTime || !endTime || !purpose || !leadId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const appointment = await createAppointment({
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      purpose: purpose as AppointmentPurpose,
      status: (status || "SCHEDULED") as AppointmentStatus,
      address,
      notes,
      leadId,
      userId: session.user.id
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      )
    }

    // Verify the appointment exists and belongs to the user
    const existingAppointment = await getAppointmentById(id)
    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    if (existingAppointment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this appointment" },
        { status: 403 }
      )
    }

    const appointment = await updateAppointment(id, {
      ...updateData,
      startTime: updateData.startTime ? new Date(updateData.startTime) : undefined,
      endTime: updateData.endTime ? new Date(updateData.endTime) : undefined,
      purpose: updateData.purpose as AppointmentPurpose | undefined,
      status: updateData.status as AppointmentStatus | undefined,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      )
    }

    // Verify the appointment exists and belongs to the user
    const existingAppointment = await getAppointmentById(id)
    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    if (existingAppointment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this appointment" },
        { status: 403 }
      )
    }

    await deleteAppointment(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    )
  }
}
