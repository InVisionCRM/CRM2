import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getMarkerById, updateMarker, deleteMarker } from "@/lib/db/vision-markers"
import { PrismaClient, KnockStatus } from "@prisma/client"
import type { PropertyVisitStatus } from "@/components/map/types"

const prisma = new PrismaClient()

// Helper function to map frontend status string to KnockStatus enum
const mapStringToKnockStatus = (statusString: PropertyVisitStatus | "New" | "Search" | string | undefined | null): KnockStatus => {
  // Handle potential frontend internal states
  if (statusString === "New" || statusString === "Search" || !statusString) {
      return KnockStatus.KNOCKED 
  }
  // Map the user-selectable statuses
  switch (statusString) {
    case "No Answer": return KnockStatus.NO_ANSWER;
    case "Not Interested": return KnockStatus.NOT_INTERESTED;
    case "Follow up": return KnockStatus.FOLLOW_UP;
    case "Inspected": return KnockStatus.INSPECTED;
    case "In Contract": return KnockStatus.IN_CONTRACT;
    default:
      console.error(`[vision-markers/[id]] Unknown status string received: '${statusString}', defaulting to KNOCKED.`);
      return KnockStatus.KNOCKED; 
  }
};

// Helper function to map KnockStatus enum back to frontend string
const mapKnockStatusToString = (knockStatus: KnockStatus): PropertyVisitStatus | "New" => {
  switch (knockStatus) {
    case KnockStatus.NO_ANSWER: return "No Answer";
    case KnockStatus.NOT_INTERESTED: return "Not Interested";
    case KnockStatus.FOLLOW_UP: return "Follow up";
    case KnockStatus.INSPECTED: return "Inspected";
    case KnockStatus.IN_CONTRACT: return "In Contract";
    case KnockStatus.KNOCKED: return "New";
    default:
      console.warn(`[vision-markers/[id]] Unexpected KnockStatus encountered: ${knockStatus}, returning 'New'.`);
      return "New";
  }
}

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
    const markerFromDb = await getMarkerById(markerId)

    if (!markerFromDb) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 })
    }

    // Map status enum to string for consistency
    const marker = {
        ...markerFromDb,
        status: mapKnockStatusToString(markerFromDb.status)
    };

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
    const session = await getServerSession(authOptions)

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
    const dataToUpdate: any = {
      ...(lat !== undefined && { latitude: lat }),
      ...(lng !== undefined && { longitude: lng }),
      ...(address !== undefined && { address }),
      ...(notes !== undefined && { notes }),
      // Use mapping function for status
      ...(status !== undefined && { status: mapStringToKnockStatus(status) }), 
      ...(contactInfo !== undefined && { contactInfo }),
      followUp: {
        date: followUpDate || null,
        time: followUpTime || null,
        notes: followUpNotes || null,
      },
      visits,
      userId
    }

    const updatedMarkerDb = await updateMarker(markerId, dataToUpdate);

    // Map status back for response
    const updatedMarkerResponse = {
      ...updatedMarkerDb,
      status: mapKnockStatusToString(updatedMarkerDb.status)
    }

    return NextResponse.json(updatedMarkerResponse)
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
