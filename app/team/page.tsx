// app/team/page.tsx

import { UserSelector } from '@/components/team/UserSelector'
import { prisma } from '@/lib/db/prisma'
import { KnockStatus } from '@prisma/client'

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
  const users = await getUsers();
  const metrics = await getMetrics(selectedUserId);

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
    </div>
  )
}
