import { NextResponse } from "next/server"
import { sql } from "@/lib/db/client"
import { getSession } from "@/lib/auth-utils"

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
    // Query visits by address
    const visits = await sql`
      SELECT 
        id, 
        address, 
        status, 
        notes, 
        created_at as timestamp,
        salesperson_id,
        follow_up_date,
        follow_up_time,
        follow_up_notes
      FROM visits 
      WHERE address = ${address}
      ORDER BY created_at DESC
    `

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
    const userEmail = session?.user?.email || "unknown@example.com"
    console.log("User session:", session)
    console.log("User ID from session:", session?.user?.id)
    console.log("User email:", userEmail)

    // Extract data from request
    const { address, lat, lng, status, notes, followUpDate, followUpTime, followUpNotes, salesPersonId } = body

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

    // Generate UUID for the visit
    const visitId = crypto.randomUUID()
    console.log("Generated visit ID:", visitId)

    const now = new Date()

    console.log("Executing SQL insert for visit with user_id:", session?.user?.id)
    // Insert visit into database
    const result = await sql`
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
        ${address},
        ${lat},
        ${lng},
        ${status || "New"},
        ${notes || null},
        ${followUpDate ? new Date(followUpDate) : null},
        ${followUpTime || null},
        ${followUpNotes || null},
        ${salesPersonId || userEmail},
        ${now},
        ${now},
        ${session?.user?.id || null}
      )
      RETURNING id, address, status, user_id
    `
    console.log("SQL insert result for visit:", result)

    if (!result || result.length === 0) {
      console.error("No result returned from SQL insert")
      throw new Error("Failed to create visit - no ID returned")
    }

    // Also update the vision_markers table if a marker exists for this address
    try {
      console.log("Checking for existing marker at address:", address)
      const existingMarker = await sql`
        SELECT id, visits FROM vision_markers
        WHERE address = ${address}
        LIMIT 1
      `
      console.log("Existing marker query result:", existingMarker)

      if (existingMarker && existingMarker.length > 0) {
        const markerId = existingMarker[0].id
        console.log("Found existing marker with ID:", markerId)

        const existingVisits = existingMarker[0].visits || []
        console.log("Existing visits:", existingVisits)

        // Create a new visit object to add to the marker's visits array
        const newVisit = {
          id: visitId,
          date: now.toISOString(),
          salesPersonId: salesPersonId || userEmail,
          salesPersonName: session?.user?.name || "Unknown",
          salesPersonEmail: userEmail,
          status: status || "New",
          notes: notes || "",
          followUpDate: followUpDate || null,
        }
        console.log("New visit to add to marker:", newVisit)

        // Add the new visit to the existing visits array
        const updatedVisits = [newVisit, ...existingVisits]

        console.log("Updating marker with new visits array...")
        // Update the marker with the new visits array
        await sql`
          UPDATE vision_markers
          SET 
            visits = ${JSON.stringify(updatedVisits)},
            updated_at = ${now}
          WHERE id = ${markerId}
        `
        console.log("Successfully updated marker with new visit")
      } else {
        console.log("No existing marker found for address:", address)
      }
    } catch (markerError) {
      console.error("Error updating vision marker with visit:", markerError)
      // Continue even if marker update fails
    }

    // Create calendar event for follow-up if needed
    if (followUpDate && followUpTime) {
      try {
        console.log("Creating calendar event for follow-up...")
        // Convert date and time to ISO format for calendar
        const startDate = new Date(followUpDate)
        const [hourMinute, period] = followUpTime.split(" ")
        let [hours, minutes] = hourMinute.split(":").map(Number)

        // Convert to 24-hour format
        if (period === "PM" && hours < 12) hours += 12
        if (period === "AM" && hours === 12) hours = 0

        startDate.setHours(hours, minutes, 0, 0)

        // Create end date (1 hour after start)
        const endDate = new Date(startDate)
        endDate.setHours(endDate.getHours() + 1)

        // Call calendar API to create event
        const baseUrl = process.env.API_BASE_URL || `${request.headers.get("origin") || ""}`
        console.log("Using base URL for calendar API:", baseUrl)

        const calendarResponse = await fetch(`${baseUrl}/api/calendar-events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `Follow-up Visit: ${address}`,
            description: followUpNotes || "Follow-up visit",
            location: address,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            type: "follow_up",
            status: "scheduled",
          }),
        })

        if (!calendarResponse.ok) {
          console.error("Calendar API response not OK:", await calendarResponse.text())
        } else {
          console.log("Successfully created calendar event")
        }
      } catch (error) {
        console.error("Error creating calendar event:", error)
        // Continue even if calendar event creation fails
      }
    }

    console.log("Successfully created visit:", result[0])
    return NextResponse.json({
      id: result[0].id,
      success: true,
      visit: result[0],
    })
  } catch (error) {
    console.error("Error saving visit:", error)
    return NextResponse.json(
      {
        error: "Failed to save visit",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
