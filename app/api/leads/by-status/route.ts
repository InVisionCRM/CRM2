import { sql } from "@/lib/db/client"
import { NextResponse } from "next/server"
import type { Lead } from "@/types/lead"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    if (!status) {
      return NextResponse.json({ error: "Status parameter is required" }, { status: 400 })
    }

    const leads = await sql<Lead[]>`
      SELECT 
        id, 
        name, 
        first_name as "firstName", 
        last_name as "lastName", 
        email, 
        phone, 
        address, 
        street_address as "streetAddress",
        city,
        state,
        zipcode,
        status, 
        assigned_to as "assignedTo", 
        notes, 
        insurance_company,
        insurance_policy_number,
        insurance_phone,
        insurance_secondary_phone,
        insurance_adjuster_name,
        insurance_adjuster_phone,
        insurance_adjuster_email,
        insurance_deductible,
        created_at, 
        updated_at 
      FROM leads 
      WHERE status = ${status}
      ORDER BY created_at DESC
    `

    return NextResponse.json(leads)
  } catch (error) {
    console.error("Error fetching leads by status:", error)
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}
