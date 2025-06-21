import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? "";

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 20,
    });

    return NextResponse.json(users);
  } catch (e) {
    console.error("User search error", e);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
} 