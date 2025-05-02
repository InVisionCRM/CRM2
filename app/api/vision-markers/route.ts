import { getSession } from "@/lib/auth-utils"
import { NextResponse } from "next/server"
import { getMarkers, createMarker } from "@/lib/db/vision-markers"
import { KnockStatus } from "@prisma/client"

// Helper function to map string to KnockStatus enum
const mapStringToKnockStatus = (statusString: string | undefined | null): KnockStatus => {
  const upperCaseStatus = statusString?.toUpperCase().replace(" ", "_"); // Handle potential spaces like "Not Visited" -> "NOT_VISITED"
  switch (upperCaseStatus) {
    case "KNOCKED": return KnockStatus.KNOCKED;
    case "NO_ANSWER": return KnockStatus.NO_ANSWER;
    case "INTERESTED": return KnockStatus.INTERESTED;
    case "APPOINTMENT_SET": return KnockStatus.APPOINTMENT_SET;
    case "INSPECTED": return KnockStatus.INSPECTED;
    case "FOLLOW-UP": return KnockStatus.FOLLOW_UP; // Handle Follow-up
    case "NOT_INTERESTED": return KnockStatus.NOT_INTERESTED; // Handle Not Interested
    case "NOT_VISITED": return KnockStatus.NOT_VISITED;
    default:
      console.warn(`Unknown status string received: '${statusString}', defaulting to NOT_VISITED.`);
      return KnockStatus.NOT_VISITED; // Default fallback
  }
};

// GET all vision markers
export async function GET() {
  try {
    console.log("GET /api/vision-markers - Fetching all markers")
    const session = await getSession()

    // Optional auth restriction
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const markers = await getMarkers()

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

    // Use the helper function to safely map the status
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
