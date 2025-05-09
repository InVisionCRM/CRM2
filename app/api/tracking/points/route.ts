import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RecordRoutePointsAPISchema, RoutePointInput } from '@/lib/schemas/tracking';
// Assume getCurrentUser is a function that resolves the current user from JWT/session
// You'll need to replace this with your actual authentication logic
import { getCurrentUser } from '@/lib/auth-utils'; // Or your actual auth path
import { getRouteForSession } from '@/lib/tracking'; // Import the lib function

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(); // Implement or replace this
    if (!currentUser || !currentUser.id) { // Added null check for currentUser.id
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = RecordRoutePointsAPISchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
    }

    const { points } = validation.data;

    const dataToCreate = points.map((point: RoutePointInput) => ({
      userId: currentUser.id, // Assumes currentUser has an id property
      lat: point.lat,
      lng: point.lng,
      timestamp: point.timestamp ? new Date(point.timestamp) : new Date(),
    }));

    // Using createMany for batch inserting.
    // Prisma's createMany does not support returning the created records by default on all databases.
    // If you need the created records, you might need to create them one by one or use a transaction.
    // For upserting, Prisma doesn't have a direct batch upsert.
    // A common pattern is to delete and then create, or loop and upsert if specific conflict handling is needed.
    // For simplicity and performance for this use case (tracking points), `createMany` is often sufficient.
    // If points *must* be upserted (e.g. based on a unique constraint on userId+timestamp),
    // you'd need a more complex logic, possibly involving a transaction and looping `prisma.routePoint.upsert`.

    const result = await prisma.routePoint.createMany({
      data: dataToCreate,
      skipDuplicates: true, // This helps avoid errors if a point with the same unique key somehow gets sent again, though our schema doesn't have a unique constraint other than ID.
    });

    return NextResponse.json({ message: 'Route points recorded', count: result.count }, { status: 201 });

  } catch (error) {
    console.error('Error recording route points:', error);
    if (error instanceof Error && error.message.includes('Authentication')) { // Example of specific error handling
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');

    if (!sinceParam) {
      return NextResponse.json({ error: '`since` query parameter is required' }, { status: 400 });
    }

    const sinceDate = new Date(sinceParam);
    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json({ error: '`since` query parameter must be a valid ISO date string' }, { status: 400 });
    }

    const routePoints = await getRouteForSession(currentUser.id, sinceDate);

    return NextResponse.json(routePoints, { status: 200 });

  } catch (error) {
    console.error('Error fetching route points:', error);
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 