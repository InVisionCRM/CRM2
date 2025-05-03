import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db/prisma"; // Assuming prisma client instance is exported from here

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Calculate the timestamp for 12 hours ago
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    // Query the Visit table
    const knockCount = await prisma.visit.count({
      where: {
        userId: userId,
        createdAt: {
          gte: twelveHoursAgo, // Greater than or equal to 12 hours ago
        },
        // Optionally, filter by specific statuses that count as a "knock" if needed
        // e.g., status: { in: [KnockStatus.NO_ANSWER, KnockStatus.NOT_INTERESTED, ...] } 
      },
    });

    console.log(`[knock-stats] User ${userId} has ${knockCount} knocks in last 12 hours.`);
    
    return NextResponse.json({ count: knockCount });

  } catch (error) {
    console.error("[knock-stats] Error fetching knock count:", error);
    return NextResponse.json(
      { error: "Failed to fetch knock count" },
      { status: 500 }
    );
  }
} 