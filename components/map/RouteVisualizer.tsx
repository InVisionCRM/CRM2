'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Map, GeoJSONSource } from 'mapbox-gl';
import { Feature, LineString } from 'geojson';
import { useMapContext } from './map-context'; // Assuming this context might provide the map instance or related state

// This should match the structure returned by your API and prisma schema for RoutePoint
interface RoutePoint {
  id: string;
  userId: string;
  timestamp: string; // ISO string
  lat: number;
  lng: number;
}

interface RouteVisualizerProps {
  since: string | null; // ISO date string for when to start fetching points from
  mapInstance: Map | null; // Pass the map instance directly
  routeLayerId?: string;
  routeSourceId?: string;
  lineColor?: string;
  lineWidth?: number;
}

const DEFAULT_ROUTE_LAYER_ID = 'user-route-layer';
const DEFAULT_ROUTE_SOURCE_ID = 'user-route-source';

export function RouteVisualizer({
  since,
  mapInstance,
  routeLayerId = DEFAULT_ROUTE_LAYER_ID,
  routeSourceId = DEFAULT_ROUTE_SOURCE_ID,
  lineColor = '#1DA1F2', // A nice blue, consider making this a prop or theme variable
  lineWidth = 3,
}: RouteVisualizerProps) {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch route points
  useEffect(() => {
    if (!since || !mapInstance) {
      setRoutePoints([]);
      return;
    }

    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/tracking/points?since=${encodeURIComponent(since)}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Failed to fetch route points: ${response.statusText}`);
        }
        const data: RoutePoint[] = await response.json();
        // Sort by timestamp just in case they are not ordered, essential for LineString
        data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setRoutePoints(data);
      } catch (err: any) {
        console.error('Error fetching route:', err);
        setError(err.message);
        setRoutePoints([]); // Clear points on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [since, mapInstance]);

  // Update map with route layer
  useEffect(() => {
    if (!mapInstance || !mapInstance.isStyleLoaded()) {
        // Wait for map style to be loaded
        if (mapInstance) {
            const onStyleLoad = () => {
                if (mapInstance.isStyleLoaded()) updateMapLayer();
                mapInstance.off('styledata', onStyleLoad); // Use 'styledata' which fires after style is fully loaded
            };
            mapInstance.on('styledata', onStyleLoad);
            return () => mapInstance.off('styledata', onStyleLoad);
        }
        return;
    }

    const updateMapLayer = () => {
        const source = mapInstance.getSource(routeSourceId) as GeoJSONSource;

        const geoJsonFeature: Feature<LineString> | null = routePoints.length > 1
          ? {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routePoints.map(p => [p.lng, p.lat]),
              },
            }
          : null;

        if (source && geoJsonFeature) {
          source.setData(geoJsonFeature);
        } else if (geoJsonFeature) {
          mapInstance.addSource(routeSourceId, {
            type: 'geojson',
            data: geoJsonFeature,
          });
        } else if (source) {
          // No points, clear the source or remove it
          source.setData({ type: 'FeatureCollection', features: [] });
        }

        // Add layer if it doesn't exist, or update if it does
        // For simplicity, we remove and re-add if properties change. More advanced updates are possible.
        if (mapInstance.getLayer(routeLayerId)) {
          mapInstance.removeLayer(routeLayerId);
        }
        // Only add layer if we have a valid GeoJSON feature (at least 2 points)
        if (geoJsonFeature) {
            if (!mapInstance.getSource(routeSourceId) && geoJsonFeature) {
                 // Source might have been removed if no points before, re-add
                mapInstance.addSource(routeSourceId, {
                    type: 'geojson',
                    data: geoJsonFeature,
                });
            }
            mapInstance.addLayer({
                id: routeLayerId,
                type: 'line',
                source: routeSourceId,
                layout: {
                'line-join': 'round',
                'line-cap': 'round',
                },
                paint: {
                'line-color': lineColor,
                'line-width': lineWidth,
                },
            });
        }
    };

    updateMapLayer();

    // Cleanup: remove source and layer when component unmounts or dependencies change significantly
    return () => {
      if (mapInstance && mapInstance.isStyleLoaded()) {
        if (mapInstance.getLayer(routeLayerId)) {
          mapInstance.removeLayer(routeLayerId);
        }
        if (mapInstance.getSource(routeSourceId)) {
          mapInstance.removeSource(routeSourceId);
        }
      }
    };
  // Re-run when points, map instance, or style props change.
  }, [routePoints, mapInstance, routeLayerId, routeSourceId, lineColor, lineWidth]); 

  // UI for loading/error states (optional, can be handled by parent)
  if (isLoading) return <p className="text-sm text-info p-2">Loading route...</p>;
  if (error) return <p className="text-sm text-error p-2">Error loading route: {error}</p>;
  if (!since) return <p className="text-sm text-warning p-2">Please select a session to visualize.</p>;
  if (routePoints.length < 2 && !isLoading) return <p className="text-sm text-warning p-2">Not enough data to display a route for this session.</p>;

  return null; // This component only adds a layer to the map, no direct DOM output needed here
} 