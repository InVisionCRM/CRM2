import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    const whereLast12h = {
      createdAt: { gte: twelveHoursAgo },
      userId: { not: null },
    } as const;

    const [knockCount, grouped] = await Promise.all([
      prisma.visit.count({
        where: {
          userId,
          createdAt: { gte: twelveHoursAgo },
        },
      }),
      prisma.visit.groupBy({
        by: ["userId"],
        where: whereLast12h,
        _count: { id: true },
      }),
    ]);

    const leaderboardCounts = grouped.filter((g) => g._count.id > 0);
    const userIds = leaderboardCounts.map((g) => g.userId as string);
    const users =
      userIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
          });

    const userById = Object.fromEntries(users.map((u) => [u.id, u]));
    const leaderboard = leaderboardCounts
      .map((g) => ({
        userId: g.userId,
        name: userById[g.userId as string]?.name ?? userById[g.userId as string]?.email ?? "Unknown",
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ count: knockCount, leaderboard });
  } catch (error) {
    console.error("[knock-stats] Error fetching knock count:", error);
    return NextResponse.json(
      { error: "Failed to fetch knock count" },
      { status: 500 }
    );
  }
} 