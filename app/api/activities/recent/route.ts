import { NextResponse } from "next/server"
import { getRecentActivities } from "@/lib/db/activities"

export async function GET() {
  try {
    const activities = await getRecentActivities(5)
    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error in /api/activities/recent:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch recent activities" },
      { status: 500 }
    )
  }
} 