import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { 
  createVisit,
  getVisits,
  getVisitsByAddress,
  updateVisit,
  deleteVisit 
} from "@/lib/db/visits"
import { KnockStatus } from "@prisma/client"

// Helper function to map string to KnockStatus enum (copied from vision-markers route)
const mapStringToKnockStatus = (statusString: string | undefined | null): KnockStatus => {
  const upperCaseStatus = statusString?.toUpperCase().replace(" ", "_"); // Handle potential spaces like "Not Visited" -> "NOT_VISITED"
  switch (upperCaseStatus) {
    case "KNOCKED": return KnockStatus.KNOCKED;
    case "NO_ANSWER": return KnockStatus.NO_ANSWER;
    case "INTERESTED": return KnockStatus.INTERESTED;
    case "APPOINTMENT_SET": return KnockStatus.APPOINTMENT_SET;
    case "INSPECTED": return KnockStatus.INSPECTED;
    case "FOLLOW-UP": return KnockStatus.FOLLOW_UP;
    case "NOT_INTERESTED": return KnockStatus.NOT_INTERESTED;
    case "NOT_VISITED": return KnockStatus.NOT_VISITED;
    default:
      console.warn(`[visits API] Unknown status string received: '${statusString}', defaulting to NOT_VISITED.`);
      return KnockStatus.NOT_VISITED; // Default fallback
  }
};

export async function GET(request: Request) {
  try {
    console.log("GET /api/visits - Fetching visits")
    const url = new URL(request.url)
    const address = url.searchParams.get("address")

    if (!address) {
      console.error("Missing address parameter")
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
    }

    console.log("Fetching visits for address:", address)
    const visits = await getVisitsByAddress(address)
    console.log(`Found ${visits.length} visits for address: ${address}`)
    
    return NextResponse.json(visits)
  } catch (error) {
    console.error("Error fetching visits:", error)
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/visits - Creating new visit")
    const body = await request.json()
    console.log("Request body:", body)

    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      address, 
      lat, 
      lng, 
      status, 
      notes, 
      followUpDate, 
      followUpTime, 
      followUpNotes, 
      leadId 
    } = body

    if (!address || lat === undefined || lng === undefined) {
      console.error("Missing required fields:", { address, lat, lng })
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "address, lat, and lng are required",
        },
        { status: 400 },
      )
    }

    // Use the helper function to safely map the status
    const mappedStatus = mapStringToKnockStatus(status);

    const visit = await createVisit({
      address,
      latitude: lat,
      longitude: lng,
      status: mappedStatus, // Use the safely mapped status enum value
      notes: notes || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      followUpTime: followUpTime || null,
      followUpNotes: followUpNotes || null,
      leadId: leadId || null,
      userId: session.user.id
    })

    console.log("Successfully created visit:", visit)
    return NextResponse.json({
      id: visit.id,
      success: true,
      visit,
    })
  } catch (error) {
    console.error("Error saving visit:", error)
    return NextResponse.json(
      {
        error: "Failed to save visit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: "Visit ID is required" },
        { status: 400 }
      )
    }

    const visit = await updateVisit(id, {
      ...updateData,
      latitude: updateData.lat,
      longitude: updateData.lng,
      status: updateData.status as KnockStatus,
      followUpDate: updateData.followUpDate ? new Date(updateData.followUpDate) : undefined,
    })

    return NextResponse.json(visit)
  } catch (error) {
    console.error("Error updating visit:", error)
    return NextResponse.json(
      { error: "Failed to update visit" },
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
        { error: "Visit ID is required" },
        { status: 400 }
      )
    }

    await deleteVisit(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting visit:", error)
    return NextResponse.json(
      { error: "Failed to delete visit" },
      { status: 500 }
    )
  }
}
