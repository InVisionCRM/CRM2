import { NextResponse } from "next/server"
import { sql } from "@/lib/db/client"
import type { LeadFile } from "@/types/documents"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const leadId = params.id
    console.log("Fetching files for lead:", leadId)
    console.log("Database URL:", process.env.DATABASE_URL)

    // Test database connection
    try {
      const testConnection = await sql`SELECT 1 as test`
      console.log("Database connection test:", testConnection)
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
    }

    // Test if table exists
    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'files'
        );
      `
      console.log("Files table exists check:", tableCheck)
    } catch (tableError) {
      console.error("Table check failed:", tableError)
    }

    const result = await sql`
      SELECT 
        id,
        name,
        url,
        type,
        size,
        category,
        created_at as "uploadedAt"
      FROM files 
      WHERE lead_id = ${leadId}
      ORDER BY created_at DESC
    `

    if (!result) {
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch files" },
      { status: 500 }
    )
  }
} 