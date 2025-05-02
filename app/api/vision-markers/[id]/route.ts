import { sql } from "@/lib/db/client"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"

// GET a specific vision marker by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const markers = await sql`
      SELECT * FROM vision_markers
      WHERE id = ${id}
    `

    if (markers.length === 0) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 })
    }

    return NextResponse.json(markers[0])
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

    // Get user ID from session or use a default value
    let userId = null
    if (session?.user?.id) {
      userId = session.user.id
      console.log("User ID from session:", userId)
    } else {
      console.log("No user ID in session, using email as identifier")
      userId = session?.user?.email || null
    }

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

    // Use salesPersonId from body if provided, otherwise use the session user's ID or email
    const salesPersonId = body.salesPersonId || userId || session?.user?.email || null
    console.log("Using salesPersonId:", salesPersonId)

    // First, check if the marker exists
    const existingMarkers = await sql`
      SELECT * FROM vision_markers
      WHERE id = ${id}
    `

    if (existingMarkers.length === 0) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 })
    }

    const existingMarker = existingMarkers[0]
    const now = new Date()

    // Handle visits - if we have a new status, add a new visit
    let visits = existingMarker.visits || []

    // If visits are provided in the update data, use those instead
    if (newVisits) {
      visits = newVisits
    }
    // Otherwise, if we have status info, create a new visit
    else if (status) {
      const newVisit = {
        id: crypto.randomUUID(),
        date: now.toISOString(),
        salesPersonId: salesPersonId || "unknown",
        salesPersonName: session?.user?.name || "Unknown",
        salesPersonEmail: session?.user?.email || "unknown@example.com",
        status,
        notes: notes || "",
        followUpDate: followUpDate || null,
      }

      visits = [newVisit, ...visits]
    }

    // Prepare follow-up data
    const followUp = {
      date: followUpDate || null,
      time: followUpTime || null,
      notes: followUpNotes || null,
    }

    console.log("Updating marker with user_id:", userId)

    // Update the marker - store both sales_person_id and user_id
    const result = await sql`
      UPDATE vision_markers
      SET 
        lat = ${lat !== undefined ? lat : existingMarker.lat},
        lng = ${lng !== undefined ? lng : existingMarker.lng},
        address = ${address || existingMarker.address},
        notes = ${notes !== undefined ? notes : existingMarker.notes},
        status = ${status || existingMarker.status},
        contact_info = ${contactInfo ? JSON.stringify(contactInfo) : existingMarker.contact_info},
        follow_up = ${JSON.stringify(followUp)},
        sales_person_id = ${salesPersonId || existingMarker.sales_person_id},
        user_id = ${userId || existingMarker.user_id},
        visits = ${JSON.stringify(visits)},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to update marker" }, { status: 500 })
    }

    // If we have follow-up info, also create a visit record
    if (followUpDate && status) {
      try {
        const visitId = crypto.randomUUID()

        await sql`
          INSERT INTO visits (
            id,
            address,
            lat,
            lng,
            status,
            notes,
            follow_up_date,
            follow_up_time,
            follow_up_notes,
            salesperson_id,
            created_at,
            updated_at,
            user_id
          ) VALUES (
            ${visitId},
            ${address || existingMarker.address},
            ${lat !== undefined ? lat : existingMarker.lat},
            ${lng !== undefined ? lng : existingMarker.lng},
            ${status},
            ${notes || null},
            ${followUpDate ? new Date(followUpDate) : null},
            ${followUpTime || null},
            ${followUpNotes || null},
            ${salesPersonId || null},
            ${now},
            ${now},
            ${userId || null}
          )
        `
      } catch (visitError) {
        console.error("Error creating visit record:", visitError)
        // Continue even if visit creation fails
      }
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error(`Error updating vision marker ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update vision marker", details: error.message }, { status: 500 })
  }
}

// DELETE a vision marker
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await sql`
      DELETE FROM vision_markers
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error(`Error deleting vision marker ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete vision marker" }, { status: 500 })
  }
}
