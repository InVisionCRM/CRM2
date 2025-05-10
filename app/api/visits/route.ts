import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { 
  createVisit,
  getVisitsByAddress,
  updateVisit,
  deleteVisit 
} from "@/lib/db/visits"
import { KnockStatus } from "@prisma/client"
import type { PropertyVisitStatus } from "@/components/map/types"

// Helper function to map frontend status string to KnockStatus enum
const mapStringToKnockStatus = (statusString: PropertyVisitStatus | "New" | "Search" | string | undefined | null): KnockStatus => {
  // Handle potential frontend internal states
  if (statusString === "New" || statusString === "Search" || !statusString) {
      // Assuming KNOCKED represents the initial/unvisited state in the DB
      // If you add a dedicated NEW status to the enum, map to that instead.
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
      // This should theoretically not happen due to frontend validation
      // But handle it defensively
      console.error(`[visits API] Unknown status string received: '${statusString}', defaulting to KNOCKED.`);
      // Consider throwing an error instead?
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
    case KnockStatus.KNOCKED: return "New"; // Map DB KNOCKED back to frontend "New"
    // Add cases for any other potential enum values if they exist and map appropriately
    default:
      // Fallback for unexpected enum values
      console.warn(`[visits API] Unexpected KnockStatus encountered: ${knockStatus}, returning 'New'.`);
      return "New";
  }
}

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
    const visitsFromDb = await getVisitsByAddress(address)
    console.log(`Found ${visitsFromDb.length} visits for address: ${address}`)

    // Map status enum to string
    const visits = visitsFromDb.map(visit => ({
      ...visit,
      status: mapKnockStatusToString(visit.status)
    }));
    
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

    // Prepare data, mapping status string to enum
    const dataToUpdate: any = { ...updateData }; // Use 'any' temporarily or create a specific type
    if (updateData.status) {
      dataToUpdate.status = mapStringToKnockStatus(updateData.status);
    }
    if (updateData.lat !== undefined) {
        dataToUpdate.latitude = updateData.lat;
        delete dataToUpdate.lat; // remove original key
    }
    if (updateData.lng !== undefined) {
        dataToUpdate.longitude = updateData.lng;
        delete dataToUpdate.lng; // remove original key
    }
    if (updateData.followUpDate) {
        dataToUpdate.followUpDate = new Date(updateData.followUpDate);
    }

    const visit = await updateVisit(id, dataToUpdate)

    // Map status back for the response
    const updatedVisitResponse = {
        ...visit,
        status: mapKnockStatusToString(visit.status)
    };

    return NextResponse.json(updatedVisitResponse)
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
