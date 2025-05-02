import { sql } from "@/lib/db/client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const address = url.searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
    }

    const markers = await sql`
      SELECT * FROM vision_markers
      WHERE address ILIKE ${`%${address}%`}
      ORDER BY created_at DESC
    `

    return NextResponse.json(markers)
  } catch (error) {
    console.error("Error searching vision markers:", error)
    return NextResponse.json({ error: "Failed to search vision markers" }, { status: 500 })
  }
}
