import { NextResponse } from "next/server"
import { getRecentActivities } from "@/lib/db/activities"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10") || 10
    
    const activities = await getRecentActivities(limit)
    
    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    )
  }
} 