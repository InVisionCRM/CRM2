import { prisma } from './prisma';
import type { RoutePoint } from '@prisma/client'; // This will be available after prisma generate
import type { RoutePointInput } from './schemas/tracking';

/**
 * Records a batch of route points for a given user.
 * This function is intended to be called from server-side logic (e.g., an API route or server action)
 * as it directly interacts with the database.
 */
export async function recordRoutePoints(
  userId: string,
  points: RoutePointInput[]
): Promise<{ count: number }> {
  if (!userId || points.length === 0) {
    // Consider throwing an error or returning a more specific response
    return { count: 0 };
  }

  const dataToCreate = points.map(point => ({
    userId,
    lat: point.lat,
    lng: point.lng,
    timestamp: point.timestamp ? new Date(point.timestamp) : new Date(),
  }));

  try {
    const result = await prisma.routePoint.createMany({
      data: dataToCreate,
      skipDuplicates: true, // Depending on your exact needs for handling duplicates
    });
    return result;
  } catch (error) {
    console.error(`Error recording route points for user ${userId}:`, error);
    // Re-throw or handle as appropriate for your application's error strategy
    throw new Error('Failed to record route points.');
  }
}

/**
 * Retrieves route points for a given user since a specified date.
 */
export async function getRouteForSession(
  userId: string,
  since: Date
): Promise<RoutePoint[]> {
  if (!userId || !since) {
    // Consider throwing an error or returning empty array
    return [];
  }

  try {
    const routePoints = await prisma.routePoint.findMany({
      where: {
        userId: userId,
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
    return routePoints;
  } catch (error) {
    console.error(`Error fetching route for session for user ${userId} since ${since}:`, error);
    throw new Error('Failed to fetch route for session.');
  }
} 