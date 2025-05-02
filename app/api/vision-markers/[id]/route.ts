import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { getMarkerById, updateMarker, deleteMarker } from "@/lib/db/vision-markers"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
type KnockStatus = 'NOT_VISITED' | 'KNOCKED' | 'NO_ANSWER' | 'INTERESTED' | 'APPOINTMENT_SET';

// GET a specific vision marker by ID
export async function GET(
  request: Request,
  { params }: { params: { id: Promise<string> } }
) {
  // Wait for the ID to be resolved
  const id = await params.id;
  const markerId = decodeURIComponent(id);

  // Return early for temporary markers
  if (markerId.startsWith('temp-')) {
    return NextResponse.json({ error: "Marker not found" }, { status: 404 })
  }

  try {
    const marker = await getMarkerById(markerId)

    if (!marker) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 })
    }

    return NextResponse.json(marker)
  } catch (error) {
    console.error(`Error fetching vision marker ${markerId}:`, error)
    return NextResponse.json({ error: "Failed to fetch vision marker" }, { status: 500 })
  }
}

// PUT/UPDATE a vision marker
export async function PUT(
  request: Request,
  { params }: { params: { id: Promise<string> } }
) {
  // Wait for the ID to be resolved
  const id = await params.id;
  const markerId = decodeURIComponent(id);

  // Return early for temporary markers
  if (markerId.startsWith('temp-')) {
    return NextResponse.json({ error: "Invalid marker ID" }, { status: 400 })
  }

  try {
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
    const existingMarker = await getMarkerById(markerId)

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
    const updatedMarker = await updateMarker(markerId, {
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
    console.error(`Error updating vision marker ${markerId}:`, error)
    return NextResponse.json(
      { error: "Failed to update vision marker", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// DELETE a vision marker
export async function DELETE(
  request: Request,
  { params }: { params: { id: Promise<string> } }
) {
  // Wait for the ID to be resolved
  const id = await params.id;
  const markerId = decodeURIComponent(id);

  // Return early for temporary markers
  if (markerId.startsWith('temp-')) {
    return NextResponse.json({ error: "Invalid marker ID" }, { status: 400 })
  }

  try {
    const marker = await deleteMarker(markerId)
    return NextResponse.json({ success: true, id: marker.id })
  } catch (error) {
    console.error(`Error deleting vision marker ${markerId}:`, error)
    return NextResponse.json({ error: "Failed to delete vision marker" }, { status: 500 })
  }
}
