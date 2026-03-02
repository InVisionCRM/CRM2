// app/team/page.tsx

import { UserSelector } from '@/components/team/UserSelector'
import { prisma } from '@/lib/db/prisma'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface User {
  id: string
  name: string
}

export interface UserMetrics {
  userId: string | 'all'
  totalDoorsKnocked: number
  totalLeadsAssigned: number
}

async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc'
    }
  });
  return users;
}

async function getMetrics(userId: string | 'all'): Promise<UserMetrics> {
  if (userId === 'all') {
    // Get total metrics across all users
    const [totalDoorsKnocked, totalLeadsAssigned] = await Promise.all([
      prisma.visit.count(),
      prisma.lead.count()
    ]);

    return {
      userId: 'all',
      totalDoorsKnocked,
      totalLeadsAssigned
    };
  }

  // Get metrics for specific user
  const [doorsKnocked, leadsAssigned] = await Promise.all([
    prisma.visit.count({
      where: {
        userId: userId
      }
    }),
    prisma.lead.count({
      where: {
        assignedToId: userId
      }
    })
  ]);

  return {
    userId,
    totalDoorsKnocked: doorsKnocked,
    totalLeadsAssigned: leadsAssigned
  };
}

export interface LeaderboardEntry {
  userId: string
  name: string
  count: number
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const twelveHoursAgo = new Date();
  twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

  const grouped = await prisma.visit.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gte: twelveHoursAgo },
      userId: { not: null },
    },
    _count: { id: true },
  });

  const withKnocks = grouped.filter((g) => g._count.id > 0);
  if (withKnocks.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: withKnocks.map((g) => g.userId as string) } },
    select: { id: true, name: true, email: true },
  });
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  return withKnocks
    .map((g) => ({
      userId: g.userId as string,
      name: userById[g.userId as string]?.name ?? userById[g.userId as string]?.email ?? 'Unknown',
      count: g._count.id,
    }))
    .sort((a, b) => b.count - a.count);
}

function MetricCard({ title, value, description }: { title: string; value: number; description?: string }) {
  return (
    <div className="bg-card text-card-foreground shadow-lg rounded-xl p-6 border">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
      {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
    </div>
  )
}

export const dynamic = 'force-dynamic';
export default async function TeamPage({
  searchParams,
}: {
  searchParams: { userId?: string }
}) {
  const selectedUserId = searchParams?.userId || 'all';
  const [users, metrics, leaderboard] = await Promise.all([
    getUsers(),
    getMetrics(selectedUserId),
    getLeaderboard(),
  ]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Team Performance</h1>
        <p className="text-muted-foreground">View key metrics for your team members.</p>
      </header>

      <UserSelector users={users} selectedUserId={selectedUserId} />

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Metrics for: <span className="text-primary">{selectedUserId === 'all' ? 'All Users' : users.find(u => u.id === selectedUserId)?.name || 'Selected User'}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <MetricCard title="Total Doors Knocked" value={metrics.totalDoorsKnocked} description="Represents the total number of doors knocked." />
          <MetricCard title="Total Leads Assigned" value={metrics.totalLeadsAssigned} description="Indicates the sum of all leads assigned." />
        </div>
      </section>

      {leaderboard.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Knock leaderboard (last 12 hours)</h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Knocks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((row, i) => (
                  <TableRow key={row.userId}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  )
}
