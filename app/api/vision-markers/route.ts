import { getSession } from "@/lib/auth-utils"
import { NextResponse } from "next/server"
import { getMarkers, createMarker } from "@/lib/db/vision-markers"
import { KnockStatus } from "@prisma/client"

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

    // Create the marker
    const marker = await createMarker({
      latitude: lat,
      longitude: lng,
      address,
      notes: notes || null,
      status: (status || "NOT_VISITED") as KnockStatus,
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
