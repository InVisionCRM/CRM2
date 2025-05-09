'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapProvider } from '@/components/map/map-context';
import MapboxMap, { MapboxMapRef, MapboxMarkerData } from '@/components/map/mapbox-map';
import { RouteVisualizer } from '@/components/map/RouteVisualizer';
import { Map } from 'mapbox-gl';

// A simple date input, replace with a proper date picker component as needed
const DateInput: React.FC<{ value: string; onChange: (value: string) => void; label: string }> = ({ value, onChange, label }) => (
  <div className="mb-4">
    <label htmlFor="since-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <input
      id="since-date"
      type="datetime-local" // Allows picking date and time
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  </div>
);

export default function VisualizeRoutePage() {
  // Default to T-1 hour for visualization start
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 16);
  const [sinceDateTime, setSinceDateTime] = useState<string>(oneHourAgo);
  const [selectedSince, setSelectedSince] = useState<string | null>(null);

  const mapRef = useRef<MapboxMapRef>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);

  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMapInstance();
      setMapInstance(map);
    }
  }, [mapRef.current]); // Re-run if mapRef changes (should be stable)

  const handleVisualize = () => {
    if (sinceDateTime) {
      setSelectedSince(new Date(sinceDateTime).toISOString());
    }
  };
  
  if (!mapboxAccessToken) {
    return (
      <div className="p-4 text-red-500">
        Error: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is not configured.
      </div>
    );
  }

  // Dummy data for MapboxMap props if needed, or adjust MapboxMap to not require them when not used.
  const dummyMarkers: MapboxMarkerData[] = [];
  const onMarkerClick = (marker: MapboxMarkerData) => {
    console.log('Marker clicked (visualize page):', marker);
  };

  return (
    <MapProvider>
      <div className="h-screen flex flex-col p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Visualize User Route</h1>
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
          <DateInput 
            label="Show route since:"
            value={sinceDateTime} 
            onChange={setSinceDateTime} 
          />
          <button 
            onClick={handleVisualize}
            className="btn btn-primary"
            disabled={!sinceDateTime}
          >
            Load Route
          </button>
        </div>

        <div className="flex-grow h-[calc(100vh-200px)]"> {/* Adjust height as needed */} 
          <MapboxMap
            ref={mapRef}
            markersData={dummyMarkers} // Provide empty or default markers
            onMarkerClick={onMarkerClick} // Provide a NOP or simple handler
            accessToken={mapboxAccessToken}
            initialCenter={[-98.5795, 39.8283]} // Center of USA
            initialZoom={4}
            // mapStyle="mapbox://styles/mapbox/streets-v11" // Optional: override default style
          />
          {mapInstance && selectedSince && (
            <RouteVisualizer 
              since={selectedSince}
              mapInstance={mapInstance} 
            />
          )}
        </div>
         {selectedSince && !mapInstance && <p className='text-orange-500 p-2'>Map instance not yet available for RouteVisualizer.</p>}
      </div>
    </MapProvider>
  );
} 