import { NextResponse } from "next/server"
import { getLeads, createLead } from "@/lib/db/leads"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { LeadStatus } from "@prisma/client"
import type { SortField, SortOrder } from "@/app/leads/page"

export async function GET(request: Request) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status") as LeadStatus | null
    const assignedTo = url.searchParams.get("assignedTo")
    const search = url.searchParams.get("search")
    const sort = url.searchParams.get("sort") as SortField | undefined
    const order = url.searchParams.get("order") as SortOrder | undefined

    // Fetch leads from the database with filters
    const leads = await getLeads({
      status,
      assignedTo: assignedTo || undefined,
      search: search || undefined,
      sort,
      order,
      userId: session.user.id, // Pass the user ID
    })

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
    const session = await getServerSession(authOptions);
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
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      status: body.status,
      assignedToId: userId, // Automatically assign to current user
      notes: body.notes || null,
      userId: userId, // Pass the fetched user ID
    }

    console.log("Creating lead with data:", leadData)

    const newLead = await createLead(leadData)
    return NextResponse.json(newLead, { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to create lead"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
