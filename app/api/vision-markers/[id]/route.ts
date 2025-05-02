import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { getMarkerById, updateMarker, deleteMarker } from "@/lib/db/vision-markers"
import { KnockStatus } from "@prisma/client"

// GET a specific vision marker by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const marker = await getMarkerById(id)

    if (!marker) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 })
    }

    return NextResponse.json(marker)
  } catch (error) {
    console.error(`Error fetching vision marker ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch vision marker" }, { status: 500 })
  }
}

// PUT/UPDATE a vision marker
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const session = await getSession()

    console.log("User session:", session?.user)

    // Get user ID from session
    const userId = session?.user?.id || null
    console.log("User ID from session:", userId)

    const {
      lat,
      lng,
      address,
      notes,
      status,
      contactInfo,
      followUpDate,
      followUpTime,
      followUpNotes,
      visits: newVisits,
    } = body

    // Get the existing marker to merge visits
    const existingMarker = await getMarkerById(id)

    if (!existingMarker) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 })
    }

    // Handle visits - if we have a new status, add a new visit
    let visits = existingMarker.visits as any[] || []

    // If visits are provided in the update data, use those instead
    if (newVisits) {
      visits = newVisits
    }
    // Otherwise, if we have status info, create a new visit
    else if (status) {
      const newVisit = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        salesPersonId: userId || "unknown",
        salesPersonName: session?.user?.name || "Unknown",
        salesPersonEmail: session?.user?.email || "unknown@example.com",
        status,
        notes: notes || "",
        followUpDate: followUpDate || null,
      }

      visits = [newVisit, ...visits]
    }

    // Update the marker
    const updatedMarker = await updateMarker(id, {
      ...(lat !== undefined && { latitude: lat }),
      ...(lng !== undefined && { longitude: lng }),
      ...(address !== undefined && { address }),
      ...(notes !== undefined && { notes }),
      ...(status !== undefined && { status: status as KnockStatus }),
      ...(contactInfo !== undefined && { contactInfo }),
      followUp: {
        date: followUpDate || null,
        time: followUpTime || null,
        notes: followUpNotes || null,
      },
      visits,
      userId
    })

    return NextResponse.json(updatedMarker)
  } catch (error) {
    console.error(`Error updating vision marker ${params.id}:`, error)
    return NextResponse.json(
      { error: "Failed to update vision marker", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE a vision marker
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const marker = await deleteMarker(id)
    return NextResponse.json({ success: true, id: marker.id })
  } catch (error) {
    console.error(`Error deleting vision marker ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete vision marker" }, { status: 500 })
  }
}
