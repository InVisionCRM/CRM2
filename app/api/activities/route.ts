import { NextResponse } from "next/server"
import { getAllActivities, getTotalActivitiesCount } from "@/lib/db/activities"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    
    const [items, total] = await Promise.all([
      getAllActivities(page, limit),
      getTotalActivitiesCount()
    ])
    
    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    )
  }
} 