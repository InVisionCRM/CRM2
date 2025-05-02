import { sql } from "@/lib/db/client"
import { getSession } from "@/lib/auth-utils"
import { NextResponse } from "next/server"

// GET all vision markers
export async function GET() {
  try {
    console.log("GET /api/vision-markers - Fetching all markers")
    const session = await getSession()

    // Optional auth restriction
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const markers = await sql`
      SELECT * FROM vision_markers
      ORDER BY created_at DESC
    `

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

    // Get user ID from session or use a default value
    let userId = null
    if (session?.user?.id) {
      userId = session.user.id
      console.log("POST /api/vision-markers - User ID from session:", userId)
    } else {
      console.log("POST /api/vision-markers - No user ID in session, using email as identifier")
      userId = session?.user?.email || null
    }

    const { lat, lng, address, notes, status, contactInfo, followUpDate, followUpTime, followUpNotes } = body

    // Use salesPersonId from body if provided, otherwise use the session user's ID or email
    const salesPersonId = body.salesPersonId || userId || session?.user?.email || null
    console.log("POST /api/vision-markers - Using salesPersonId:", salesPersonId)

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

    const contactInfoString = JSON.stringify(contactInfo || {})
    const followUpString = JSON.stringify({
      date: followUpDate || null,
      time: followUpTime || null,
      notes: followUpNotes || null,
    })
    const visitsArray = body.visits ? JSON.stringify(body.visits) : JSON.stringify([])

    // Generate a UUID for the marker
    const markerId = crypto.randomUUID()
    console.log("POST /api/vision-markers - Generated marker ID:", markerId)

    const now = new Date()
    console.log("POST /api/vision-markers - Current timestamp:", now)

    // Store both sales_person_id (for backward compatibility) and user_id (for proper foreign key)
    console.log("POST /api/vision-markers - Executing SQL insert with user_id:", userId)
    
    const result = await sql`
      INSERT INTO vision_markers (
        id, lat, lng, address, notes, status, contact_info, follow_up, 
        sales_person_id, user_id, visits, timestamp, created_at, updated_at
      ) VALUES (
        ${markerId}, ${lat}, ${lng}, ${address}, ${notes || null}, ${status || "New"}, 
        ${contactInfoString}, ${followUpString}, ${salesPersonId}, ${userId}, ${visitsArray}, 
        ${now}, ${now}, ${now}
      )
      RETURNING id, lat, lng, address, status, sales_person_id, user_id
    `
    console.log("POST /api/vision-markers - SQL insert result:", result)

    if (!result || result.length === 0) {
      console.error("POST /api/vision-markers - No result returned from SQL insert")
      return NextResponse.json({ error: "Failed to create marker" }, { status: 500 })
    }

    console.log("POST /api/vision-markers - Successfully created marker:", result[0])
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("POST /api/vision-markers - Error creating marker:", error)
    return NextResponse.json(
      { error: "Failed to create marker", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
