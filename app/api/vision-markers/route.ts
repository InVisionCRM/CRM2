import { getSession } from "@/lib/auth-utils"
import { NextResponse } from "next/server"
import { getMarkers, createMarker } from "@/lib/db/vision-markers"
import { KnockStatus } from "@prisma/client"
import type { PropertyVisitStatus } from "@/components/map/MapInteractionDrawer" // Import frontend type for reference

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
      console.error(`Unknown status string received: '${statusString}', defaulting to KNOCKED.`);
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
      console.warn(`Unexpected KnockStatus encountered: ${knockStatus}, returning 'New'.`);
      return "New";
  }
}

// GET all vision markers
export async function GET() {
  try {
    console.log("GET /api/vision-markers - Fetching all markers")
    const session = await getSession()

    // Optional auth restriction
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const markersFromDb = await getMarkers()

    // Map the status enum back to the string expected by the frontend
    const markers = markersFromDb.map(marker => ({
      ...marker,
      status: mapKnockStatusToString(marker.status) // Use the new mapping function
    }));

    console.log(`GET /api/vision-markers - Found ${markers.length} markers`)
    return NextResponse.json({ markers })
  } catch (error) {
    console.error("Error fetching vision markers:", error)
    return NextResponse.json({ error: "Failed to fetch vision markers" }, { status: 500 })
  }
}

// POST a new vision marker
export async function POST(request: Request) {
  try {
    console.log("POST /api/vision-markers - Starting request processing")
    const body = await request.json()
    console.log("POST /api/vision-markers - Request body:", body)

    const session = await getSession()
    console.log("POST /api/vision-markers - User session:", session?.user)

    // Get user ID from session
    const userId = session?.user?.id || null
    console.log("POST /api/vision-markers - User ID from session:", userId)

    const { lat, lng, address, notes, status, contactInfo, followUpDate, followUpTime, followUpNotes } = body

    if (!lat || !lng || !address) {
      console.error("POST /api/vision-markers - Missing required fields:", { lat, lng, address })
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "lat, lng, and address are required",
        },
        { status: 400 },
      )
    }

    // Use the helper function to safely map the status string from the request body
    const mappedStatus = mapStringToKnockStatus(status);

    // Create the marker
    const marker = await createMarker({
      latitude: lat,
      longitude: lng,
      address,
      notes: notes || null,
      status: mappedStatus, // Use the safely mapped status enum value
      contactInfo: contactInfo || undefined,
      followUp: {
        date: followUpDate || null,
        time: followUpTime || null,
        notes: followUpNotes || null,
      },
      visits: body.visits || [],
      userId
    })

    console.log("POST /api/vision-markers - Successfully created marker:", marker)
    return NextResponse.json(marker)
  } catch (error) {
    console.error("POST /api/vision-markers - Error creating marker:", error)
    return NextResponse.json(
      { error: "Failed to create marker", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
