import { NextResponse } from "next/server"
import { getLeads, createLead } from "@/lib/db/leads"
import { getSession } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status")

    // Fetch leads from the database
    const leads = await getLeads()

    // Log the raw leads data received from the database function
    console.log("Raw leads fetched from DB:", JSON.stringify(leads, null, 2));

    // Filter by status if provided, with added safety check
    const filteredLeads = status
      ? leads.filter((lead) => 
          lead.status && // Check if status exists
          typeof lead.status === 'string' && // Check if status is a string
          lead.status.toLowerCase() === status.toLowerCase()
        )
      : leads;
      
    // Log the filtered leads before sending
    console.log(`Filtered leads for status '${status || 'all'}':`, JSON.stringify(filteredLeads, null, 2));

    return NextResponse.json(filteredLeads)
  } catch (error) {
    console.error("Error in GET /api/leads:", error) // Log the specific error location
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession() // Use the utility function
    if (!session?.user?.id) {
      console.error("Unauthorized: No session found or user ID missing in session.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    console.log("Extracted userId from session:", userId, "Type:", typeof userId);

    const body = await request.json()

    // Transform the incoming data to match our function parameters
    const leadData = {
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      streetAddress: body.street_address,
      city: body.city,
      state: body.state,
      zipcode: body.zipcode,
      status: body.status,
      assignedToId: body.assigned_to,
      notes: body.notes,
      userId: userId, // Pass the fetched user ID
    }

    const newLead = await createLead(leadData)
    return NextResponse.json(newLead, { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
