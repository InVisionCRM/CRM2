import React, { useState, useEffect, useCallback, useRef } from 'react';

interface RoutePointInput {
  lat: number;
  lng: number;
  timestamp?: string;
}

interface UseRouteTrackerProps {
  bufferTime?: number; // in milliseconds
  minDistanceFilter?: number; // in meters
}

const DEFAULT_BUFFER_TIME = 10000; // 10 seconds
const DEFAULT_MIN_DISTANCE_FILTER = 20; // 20 meters

function haversineDistance(coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}): number {
    const R = 6371e3; // metres
    const φ1 = coords1.lat * Math.PI/180; // φ, λ in radians
    const φ2 = coords2.lat * Math.PI/180;
    const Δφ = (coords2.lat-coords1.lat) * Math.PI/180;
    const Δλ = (coords2.lng-coords1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
}


export function useRouteTracker({
  bufferTime = DEFAULT_BUFFER_TIME,
  minDistanceFilter = DEFAULT_MIN_DISTANCE_FILTER,
}: UseRouteTrackerProps = {}) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pointBufferRef = useRef<RoutePointInput[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const lastSentPointRef = useRef<{lat: number, lng: number} | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sendBufferedPoints = useCallback(async () => {
    if (pointBufferRef.current.length === 0) {
      return;
    }

    const pointsToSend = [...pointBufferRef.current];
    pointBufferRef.current = []; // Clear buffer immediately

    try {
      // console.log('Sending points:', pointsToSend);
      const response = await fetch('/api/tracking/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points: pointsToSend }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send points');
      }
      // console.log('Points sent successfully');
      if (pointsToSend.length > 0) {
        const lastPoint = pointsToSend[pointsToSend.length -1];
        lastSentPointRef.current = {lat: lastPoint.lat, lng: lastPoint.lng };
      }
    } catch (err: any) {
      console.error('Error sending tracking points:', err);
      setError(err.message || 'Unknown error sending points');
      // Optionally, re-add points to buffer if sending failed, with retry logic
      // pointBufferRef.current = [...pointsToSend, ...pointBufferRef.current];
    }
  }, []);

  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    // console.log('New position:', latitude, longitude, accuracy);

    // Optional: Filter by accuracy
    // if (accuracy > 50) { // e.g., ignore if accuracy is worse than 50 meters
    //   console.log('Skipping point due to low accuracy:', accuracy);
    //   return;
    // }

    const newPoint = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };

    if (lastSentPointRef.current) {
        const distance = haversineDistance(lastSentPointRef.current, newPoint);
        if (distance < minDistanceFilter) {
            // console.log(`Skipping point, distance ${distance.toFixed(1)}m < ${minDistanceFilter}m`);
            return;
        }
    }

    pointBufferRef.current.push(newPoint);

  }, [minDistanceFilter]);

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    console.error('Geolocation error:', err);
    setError(`Geolocation error: ${err.message}`);
    // Potentially stop tracking if critical error e.g. permissions denied
    if (err.code === err.PERMISSION_DENIED) {
        setIsTracking(false);
    }
  }, []);

  useEffect(() => {
    if (isTracking) {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser.');
        setIsTracking(false);
        return;
      }

      setError(null);
      pointBufferRef.current = []; // Clear buffer on start
      lastSentPointRef.current = null;

      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionSuccess,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 10000, // Max time to wait for a position
          maximumAge: 0, // Don't use cached position
        }
      );

      // Start interval timer to send buffered points
      timerRef.current = setInterval(sendBufferedPoints, bufferTime);

      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Send any remaining points when tracking stops
        sendBufferedPoints();
      };
    } else {
      // Ensure cleanup if isTracking becomes false
       if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // Send any remaining points when tracking is manually stopped
        if (pointBufferRef.current.length > 0) {
            sendBufferedPoints();
        }
    }
  }, [isTracking, bufferTime, handlePositionSuccess, handlePositionError, sendBufferedPoints]);

  const toggleTracking = () => {
    setIsTracking(prev => !prev);
  };

  return { isTracking, toggleTracking, error };
}

// Compact toggle for map overlay - matches knock counter / zoom control styling
export function RouteTrackerToggle() {
  const { isTracking, toggleTracking, error } = useRouteTracker({
    bufferTime: 10000, // 10 seconds
    minDistanceFilter: 20, // 20 meters
  });

  return (
    <div className="bg-green-800/40 backdrop-blur-sm shadow-md rounded-lg p-2 border border-lime-400/90">
      <button
        onClick={toggleTracking}
        className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
          isTracking
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-lime-600 hover:bg-lime-700 text-black'
        }`}
      >
        {isTracking ? 'Stop GPS Track' : 'Start GPS Track'}
      </button>
      {error && <p className="text-red-400 mt-1 text-xs">Error: {error}</p>}
      {isTracking && <p className="text-lime-300 mt-1 text-xs">Tracking...</p>}
    </div>
  );
} 