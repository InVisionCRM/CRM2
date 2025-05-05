"use client"

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import mapboxgl, { Map, Marker, LngLatLike } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils'; // Assuming you have this utility
import { PropertyVisitStatus } from './types'; // Assuming this type exists

// Define MarkerData type expected by this component
// IMPORTANT: Mapbox typically uses [longitude, latitude]
export interface MapboxMarkerData {
  id: string;
  position: [number, number]; // [lng, lat]
  address?: string; // Optional address info
  status?: PropertyVisitStatus | 'New' | 'Search'; // Optional status
  leadId?: string; // Add leadId
  // Add other properties as needed by your application
}

interface MapboxMapProps {
  markers: MapboxMarkerData[];
  onMarkerClick?: (marker: MapboxMarkerData) => void;
  onMarkerAdd?: (position: [number, number], address?: string) => void; // Address might need reverse geocoding
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  className?: string;
  mapStyle?: string;
}

export interface MapboxMapRef {
  flyTo: (position: [number, number], zoom?: number) => void;
  getMap: () => Map | null;
  // Add other methods you might need to expose
}

const MapboxMap = forwardRef<MapboxMapRef, MapboxMapProps>((
  {
    markers,
    onMarkerClick,
    onMarkerAdd,
    initialCenter = [-98.5795, 39.8283], // Default center of US [lng, lat]
    initialZoom = 4,
    className = "",
    mapStyle = 'mapbox://styles/mapbox/streets-v12',
  },
  ref
) => {
  console.log("--- Rendering MapboxMap ---"); // Log component render

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markersRef = useRef<{ [key: string]: Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);

  // Log when markers prop changes
  useEffect(() => {
    console.log("MapboxMap: Markers prop changed", markers);
  }, [markers]);

  // Initialize Mapbox Map
  useEffect(() => {
    console.log("MapboxMap: Initialization effect running");
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error("Mapbox Access Token is missing!");
      // TODO: Add proper error handling (e.g., show message to user)
      return;
    }
    mapboxgl.accessToken = mapboxToken;

    if (map.current || !mapContainer.current) return; // Initialize map only once

    map.current = new Map({
      container: mapContainer.current,
      style: mapStyle,
      center: initialCenter, // [lng, lat]
      zoom: initialZoom,
    });

    map.current.on('load', () => {
      console.log('Mapbox map loaded');
      setMapLoaded(true);
      // Add map controls (optional)
      map.current?.addControl(new mapboxgl.NavigationControl());
      map.current?.addControl(new mapboxgl.FullscreenControl());
    });

    // Add click handler for adding markers (if prop provided)
    if (onMarkerAdd) {
      map.current.on('click', (e) => {
        const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        console.log('Map clicked at:', coordinates);
        // TODO: Reverse geocode coordinates to get address if needed
        onMarkerAdd(coordinates /*, optional address */);
      });
    }

    // Cleanup function
    return () => {
      console.log("MapboxMap: Cleanup effect running"); // Log cleanup
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, [initialCenter, initialZoom, mapStyle, onMarkerAdd]); // Dependencies for map initialization

  // Update markers when the markers prop changes
  useEffect(() => {
    console.log("MapboxMap: Marker update effect running");
    if (!mapLoaded || !map.current) return;

    const currentMarkerIds = Object.keys(markersRef.current);
    const incomingMarkerIds = markers.map(m => m.id);

    // Remove markers that are no longer present
    currentMarkerIds.forEach(id => {
      if (!incomingMarkerIds.includes(id)) {
        markersRef.current[id]?.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    markers.forEach(markerData => {
      const { id, position, status } = markerData; // position is [lng, lat]

      if (markersRef.current[id]) {
        // Update existing marker (position and potentially style)
        markersRef.current[id].setLngLat(position as LngLatLike);
        // TODO: Update marker style based on status if needed
        // Example: markersRef.current[id].getElement().style.backgroundColor = getMarkerColor(status);
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'mapbox-marker'; // Add a class for potential default styling
        // TODO: Style the marker based on status (e.g., background color)
        // Example: el.style.backgroundColor = getMarkerColor(status);
        el.style.width = '15px';
        el.style.height = '15px';
        el.style.borderRadius = '50%';
        el.style.border = '1px solid white';

        const marker = new Marker(el)
          .setLngLat(position as LngLatLike)
          .addTo(map.current!); // Add marker to map

        // Add click listener if handler provided
        if (onMarkerClick) {
          marker.getElement().addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent map click event from firing
            console.log('Marker clicked:', markerData.id);
            onMarkerClick(markerData);
          });
        }

        markersRef.current[id] = marker;
      }
    });

  }, [markers, mapLoaded, onMarkerClick]); // Dependencies for marker updates

  // Expose map control methods via ref
  useImperativeHandle(ref, () => {
    console.log("MapboxMap: useImperativeHandle running");
    return {
      flyTo: (position: [number, number], zoom = 15) => {
        map.current?.flyTo({
          center: position as LngLatLike, // [lng, lat]
          zoom: zoom,
          essential: true, // Animation is essential
        });
      },
      getMap: () => map.current,
      // Add other methods here
    };
  }, [mapLoaded]); // Ensure map is loaded before exposing methods

  return (
    <div
      ref={mapContainer}
      className={cn("w-full h-full", className)} // Use cn for merging classes
      style={{ minHeight: '300px' }} // Example minimum height
      aria-label="Mapbox Map"
    />
  );
});

MapboxMap.displayName = "MapboxMap";

export default MapboxMap; 