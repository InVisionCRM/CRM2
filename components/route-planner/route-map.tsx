"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Plus, X, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DraggableWaypoints } from './draggable-waypoints'

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

interface RouteMapProps {
  waypoints: string[]
  onWaypointsChange: (waypoints: string[]) => void
  optimizedRoute?: {
    optimizedOrder: number[]
    totalDistance: string
    totalDuration: string
    polyline?: any
  }
  onRouteUpdate?: (route: any) => void
  className?: string
}

interface Waypoint {
  id: string
  address: string
  position?: { lat: number; lng: number }
  marker?: any
}

export function RouteMap({ 
  waypoints, 
  onWaypointsChange, 
  optimizedRoute,
  onRouteUpdate,
  className = "" 
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const routeCalculationTimeoutRef = useRef<NodeJS.Timeout>()
  const lastWaypointsRef = useRef<string>('')

  // Initialize Google Maps only once
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || mapInstanceRef.current) return

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: { lat: 42.5406, lng: -82.8713 },
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      })

      const directionsService = new window.google.maps.DirectionsService()
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        draggable: true,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#EF2D56',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      })

      directionsRenderer.setMap(map)
      
      // Handle route changes when user drags waypoints
      directionsRenderer.addListener('directions_changed', () => {
        const directions = directionsRenderer.getDirections()
        if (directions && onRouteUpdate) {
          onRouteUpdate(directions)
        }
      })

      mapInstanceRef.current = map
      directionsServiceRef.current = directionsService
      directionsRendererRef.current = directionsRenderer
      setIsMapLoaded(true)
      setMapError(null)
      
      console.log('Map initialized successfully')
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError('Failed to initialize map')
    }
  }, [onRouteUpdate])

  // Load Google Maps script only once
  useEffect(() => {
    if (isScriptLoaded) {
      initializeMap()
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setMapError('Google Maps API key not configured')
      return
    }

    if (window.google) {
      setIsScriptLoaded(true)
      initializeMap()
      return
    }

    // Only load script in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsScriptLoaded(true)
        initializeMap()
      })
      return
    }

    window.initMap = () => {
      setIsScriptLoaded(true)
      initializeMap()
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true
    
    script.onerror = () => {
      setMapError('Failed to load Google Maps')
    }

    document.head.appendChild(script)

    return () => {
      // Don't remove script on cleanup to prevent re-loading
    }
  }, [initializeMap, isScriptLoaded])

  // Debounced route calculation with waypoint comparison
  const calculateRoute = useCallback(async () => {
    if (!directionsServiceRef.current || !isMapLoaded) {
      console.log('Cannot calculate route: service not ready or map not loaded')
      return
    }

    const validWaypoints = waypoints.filter(wp => wp && wp.trim())
    const waypointsString = validWaypoints.join('|')
    
    // Skip calculation if waypoints haven't changed
    if (waypointsString === lastWaypointsRef.current) {
      console.log('Waypoints unchanged, skipping route calculation')
      return
    }
    
    if (validWaypoints.length < 2) {
      console.log('Not enough valid waypoints for route calculation')
      // Clear existing route if not enough waypoints
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] })
      }
      lastWaypointsRef.current = ''
      return
    }

    // Update last waypoints reference
    lastWaypointsRef.current = waypointsString

    // Clear any existing timeout
    if (routeCalculationTimeoutRef.current) {
      clearTimeout(routeCalculationTimeoutRef.current)
    }

    // Debounce route calculation
    routeCalculationTimeoutRef.current = setTimeout(async () => {
      setIsCalculatingRoute(true)
      setMapError(null)
      
      try {
        const origin = validWaypoints[0]
        const destination = validWaypoints[validWaypoints.length - 1]
        const waypointObjects = validWaypoints.slice(1, -1).map(wp => ({
          location: wp,
          stopover: true
        }))

        console.log('Calculating route:', { origin, destination, waypoints: waypointObjects })

        const request = {
          origin,
          destination,
          waypoints: waypointObjects,
          optimizeWaypoints: true,
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
        }

        directionsServiceRef.current.route(request, (result: any, status: any) => {
          console.log('Route calculation result:', status, result)
          
          if (status === 'OK' && directionsRendererRef.current && result) {
            directionsRendererRef.current.setDirections(result)
            
            if (onRouteUpdate) {
              onRouteUpdate(result)
            }
            setMapError(null)
          } else {
            console.error('Directions request failed:', status)
            let errorMessage = 'Route calculation failed'
            
            switch (status) {
              case 'ZERO_RESULTS':
                errorMessage = 'No route found between these locations'
                break
              case 'OVER_QUERY_LIMIT':
                errorMessage = 'Too many requests. Please try again later'
                break
              case 'REQUEST_DENIED':
                errorMessage = 'Route request was denied'
                break
              case 'INVALID_REQUEST':
                errorMessage = 'Invalid route request. Please check your addresses'
                break
              case 'UNKNOWN_ERROR':
                errorMessage = 'Unknown error occurred. Please try again'
                break
            }
            
            setMapError(errorMessage)
          }
          setIsCalculatingRoute(false)
        })
      } catch (error) {
        console.error('Error calculating route:', error)
        setMapError('Error calculating route')
        setIsCalculatingRoute(false)
      }
    }, 1500) // Increased debounce to 1.5 seconds
  }, [waypoints, isMapLoaded, onRouteUpdate])

  // Calculate route when waypoints change, but only if map is ready
  useEffect(() => {
    if (isMapLoaded && directionsServiceRef.current) {
      calculateRoute()
    }
  }, [calculateRoute, isMapLoaded])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (routeCalculationTimeoutRef.current) {
        clearTimeout(routeCalculationTimeoutRef.current)
      }
    }
  }, [])

  const addWaypoint = () => {
    const newWaypoints = [...waypoints, ""]
    onWaypointsChange(newWaypoints)
  }

  const removeWaypoint = (index: number) => {
    if (waypoints.length <= 2) return // Keep minimum 2 waypoints
    const newWaypoints = waypoints.filter((_, i) => i !== index)
    onWaypointsChange(newWaypoints)
  }

  const recalculateRoute = () => {
    if (routeCalculationTimeoutRef.current) {
      clearTimeout(routeCalculationTimeoutRef.current)
    }
    calculateRoute()
  }

  if (mapError) {
    return (
      <Card className={`bg-black/40 backdrop-blur-md border-white/20 text-white ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <MapPin className="h-5 w-5" />
            Map Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">{mapError}</div>
            <p className="text-gray-400 text-sm mb-4">
              {mapError.includes('API key') 
                ? 'Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables'
                : 'Please check your addresses and try again'
              }
            </p>
            <Button
              onClick={recalculateRoute}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-black/40 text-sm backdrop-blur-md border-white/20 text-white ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-md justify-between">
          <div className="flex items-center gap-2">
      
            
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const validWaypoints = waypoints.filter(wp => wp.trim())
                if (validWaypoints.length >= 2) {
                  const googleMapsUrl = `https://www.google.com/maps/dir/${validWaypoints.map(wp => encodeURIComponent(wp)).join('/')}`
                  window.open(googleMapsUrl, '_blank')
                }
              }}
              variant="outline"
              size="sm"
              className="bg-[#5AD2F4]/20 border-[#5AD2F4]/50 text-[#5AD2F4] hover:bg-[#5AD2F4]/30 hover:border-[#5AD2F4] hover:text-[#5AD2F4] transition-all duration-200 font-semibold"
              disabled={waypoints.filter(wp => wp.trim()).length < 2}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Open in Google Maps
            </Button>
            <Button
              onClick={recalculateRoute}
              variant="outline"
              size="sm"
              disabled={isCalculatingRoute || !isMapLoaded}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${isCalculatingRoute ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={addWaypoint}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Add Stop
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Draggable Waypoints List */}
        <DraggableWaypoints
          waypoints={waypoints}
          onWaypointsChange={onWaypointsChange}
          onRemoveWaypoint={removeWaypoint}
        />

        {/* Map Container */}
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-96 bg-gray-900 rounded-lg border border-white/20"
          />
          
          {isCalculatingRoute && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <div className="bg-black/80 p-4 rounded-lg border border-white/20">
                <div className="flex items-center gap-3 text-white">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#EF2D56]" />
                  <span>Recalculating route...</span>
                </div>
              </div>
            </div>
          )}

          {!isMapLoaded && !mapError && (
            <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-[#EF2D56] rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Route Info */}
        {optimizedRoute && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-black/30 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Total Distance</p>
              <p className="text-lg font-semibold text-white">{optimizedRoute.totalDistance}</p>
            </div>
            <div className="p-3 bg-black/30 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 mb-1">Total Duration</p>
              <p className="text-lg font-semibold text-white">{optimizedRoute.totalDuration}</p>
            </div>
          </div>
        )}

        {/* Map Instructions */}
        <div className="text-xs text-gray-400 bg-black/20 p-3 rounded border border-white/10">
          <p className="mb-1">🔄 <strong>Drag waypoints</strong> to reorder your custom route</p>
          <p className="mb-1">📍 <strong>Drag map markers</strong> to adjust precise locations</p>
          <p>🛣️ <strong>Route updates automatically</strong> when you make changes</p>
        </div>
      </CardContent>
    </Card>
  )
} 