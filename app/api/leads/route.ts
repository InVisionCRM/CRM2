import { NextResponse } from "next/server"
import { getLeads, createLead } from "@/lib/db/leads"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { LeadStatus } from "@prisma/client"
import type { SortField, SortOrder } from "@/app/leads/page"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    console.log('=== GET /api/leads - Starting ===');
    
    // Get session
    const session = await getServerSession(authOptions);
    console.log('Session data:', {
      session: !!session,
      user: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email if ID lookup fails
    let userId = session.user.id;
    const userCheck = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userCheck && session.user.email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      if (userByEmail) {
        userId = userByEmail.id;
        console.log('Using email-based user ID:', userId);
      }
    }

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status") as LeadStatus | null
    const assignedTo = url.searchParams.get("assignedTo")
    const search = url.searchParams.get("search")
    const sort = url.searchParams.get("sort") as SortField | undefined
    const order = url.searchParams.get("order") as SortOrder | undefined

    console.log('Query parameters:', { status, assignedTo, search, sort, order });

    // Fetch leads from the database with filters
    console.log('Calling getLeads with userId:', userId);
    const leads = await getLeads({
      status,
      assignedTo: assignedTo || undefined,
      search: search || undefined,
      sort,
      order,
      userId: userId, // Pass the user ID
    })

    console.log(`Successfully fetched ${leads.length} leads`);

    // Filter by status if provided, with added safety check
    const filteredLeads = status
      ? leads.filter((lead) => 
          lead.status && // Check if status exists
          typeof lead.status === 'string' && // Check if status is a string
          lead.status.toLowerCase() === status.toLowerCase()
        )
      : leads;
      
    console.log(`Returning ${filteredLeads.length} filtered leads`);

    return NextResponse.json(filteredLeads)
  } catch (error) {
    console.error("=== ERROR in GET /api/leads ===");
    console.error("Error details:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: "Failed to fetch leads", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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
    console.log("Received request body:", body);

    // Handle dateOfLoss conversion from string to Date
    let dateOfLoss: Date | null = null;
    if (body.dateOfLoss && body.dateOfLoss.trim() !== '') {
      // Try to parse MM/DD/YY format
      const dateStr = body.dateOfLoss.trim();
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        dateOfLoss = parsedDate;
      } else {
        console.warn("Invalid date format for dateOfLoss:", dateStr);
      }
    }

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
      // Insurance fields
      insuranceCompany: body.insuranceCompany || null,
      insurancePolicyNumber: body.insurancePolicyNumber || null,
      insurancePhone: body.insurancePhone || null,
      insuranceSecondaryPhone: body.insuranceSecondaryPhone || null,
      insuranceDeductible: body.insuranceDeductible || null,
      dateOfLoss: dateOfLoss,
      damageType: body.damageType || null,
      claimNumber: body.claimNumber || null,
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
