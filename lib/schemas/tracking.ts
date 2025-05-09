import { z } from 'zod';

export const RoutePointInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timestamp: z.string().datetime().optional(),
});

export const RecordRoutePointsAPISchema = z.object({
  points: z.array(RoutePointInputSchema).min(1),
});

export type RoutePointInput = z.infer<typeof RoutePointInputSchema>; 