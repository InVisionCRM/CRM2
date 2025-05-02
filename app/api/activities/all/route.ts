import { NextResponse } from "next/server"
import { getAllActivities } from "@/lib/db/activities"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const activities = await getAllActivities(page, limit)
    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error in /api/activities/all:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch activities" },
      { status: 500 }
    )
  }
} 