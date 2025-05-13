import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "0") || undefined;
    
    const activities = await prisma.activity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
} 