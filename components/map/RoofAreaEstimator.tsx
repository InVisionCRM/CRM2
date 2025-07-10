"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { AddressSearch } from "@/components/map/address-search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, Redo, Trash2 } from "lucide-react"

declare global {
  interface Window {
    google: any
  }
}

const ROOF_AREA_ESTIMATOR_MAP_ID = "roof-area-estimator-map"

interface RoofAreaEstimatorProps {
  initialCenter?: { lat: number, lng: number };
  initialZoom?: number;
}

export function RoofAreaEstimator({ initialCenter, initialZoom = 5 }: RoofAreaEstimatorProps) {
  const [map, setMap] = useState<any>(null)
  const [drawingManager, setDrawingManager] = useState<any>(null)
  const [drawnPolygon, setDrawnPolygon] = useState<any>(null)
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null)
  const [calculatedSquareFeet, setCalculatedSquareFeet] = useState<number | null>(null)
  const [center, setCenter] = useState(initialCenter || { lat: 39.8283, lng: -98.5795 }) // Default center of the US
  const [zoom, setZoom] = useState(initialCenter ? 20 : initialZoom)
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false)
  const [addressMarker, setAddressMarker] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Check if Google Maps is already loaded and load additional libraries if needed
  useEffect(() => {
    const checkAndLoadGoogleMaps = async () => {
      if (window.google && window.google.maps) {
        // Google Maps is already loaded, check if we need additional libraries
        if (window.google.maps.drawing && window.google.maps.geometry) {
          setIsGoogleMapsReady(true)
          return
        }
        
        // If libraries aren't loaded, we need to reload Google Maps with the required libraries
        // This is necessary because you can't dynamically load libraries after initial load
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (apiKey) {
          try {
            // Remove existing Google Maps scripts to avoid conflicts
            const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
            existingScripts.forEach(script => script.remove())
            
            // Clear the google object to force reload
            delete window.google
            
            // Load Google Maps with required libraries
            const script = document.createElement('script')
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry,places&loading=async`
            script.async = true
            script.onload = () => {
              // Wait a bit for libraries to be fully initialized
              setTimeout(() => {
                if (window.google?.maps?.drawing && window.google?.maps?.geometry) {
                  setIsGoogleMapsReady(true)
                } else {
                  console.error('Google Maps libraries not loaded properly')
                }
              }, 100)
            }
            script.onerror = () => {
              console.error('Failed to load Google Maps')
            }
            
            document.head.appendChild(script)
          } catch (error) {
            console.error('Error loading Google Maps libraries:', error)
          }
        }
      } else {
        // Google Maps not loaded yet, wait for it
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval)
            checkAndLoadGoogleMaps()
          }
        }, 100)
        
        // Clear interval after 10 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkInterval), 10000)
      }
    }

    checkAndLoadGoogleMaps()
  }, [])

  // Initialize map and drawing manager when Google Maps is ready
  useEffect(() => {
    if (isGoogleMapsReady) {
      initMap()
    }
  }, [isGoogleMapsReady, center, zoom])

  // Initialize map and drawing manager
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.log('Map initialization failed: missing requirements')
      return;
    }

    console.log('Initializing Google Map with controls...')

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: 'satellite',
      tilt: 45,
      // Ensure all controls are enabled and visible
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_CENTER,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
      scaleControl: true,
      streetViewControl: true,
      streetViewControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
      rotateControl: true,
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP,
      },
      // Disable restrictions that might hide controls
      restriction: null,
      // Ensure UI is not disabled
      disableDefaultUI: false,
      // Set minimum zoom to ensure controls are accessible
      minZoom: 1,
      maxZoom: 22,
    });
    
    // Wait for the map to be fully loaded before setting up drawing manager
    window.google.maps.event.addListenerOnce(googleMap, 'idle', () => {
      setMap(googleMap);

      // Always add marker for the address location (either initial or current center)
      const markerPosition = initialCenter || center;
      const marker = new window.google.maps.Marker({
        position: markerPosition,
        map: googleMap,
        title: 'Property Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
              <path fill="#ff0000" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        }
      });
      setAddressMarker(marker);

      // Only initialize drawing manager if the drawing library is available
      if (window.google.maps.drawing && googleMap instanceof window.google.maps.Map) {
        console.log('Drawing library available, initializing drawing manager...')
        try {
          const newDrawingManager = new window.google.maps.drawing.DrawingManager({
            drawingMode: window.google.maps.drawing.OverlayType.POLYGON, // Start with polygon tool active
            drawingControl: true,
            drawingControlOptions: {
              position: window.google.maps.ControlPosition.TOP_LEFT,
              drawingModes: ['polygon'],
            },
            polygonOptions: {
              fillColor: '#59ff00',
              fillOpacity: 0.3,
              strokeWeight: 3,
              strokeColor: '#59ff00',
              clickable: false,
              editable: true,
              zIndex: 1,
            },
          });
          
          newDrawingManager.setMap(googleMap);
          setDrawingManager(newDrawingManager);
          console.log('Drawing manager initialized successfully')

          // Add listener for when a polygon is completed
          window.google.maps.event.addListener(
            newDrawingManager,
            'polygoncomplete',
            handlePolygonComplete
          );
        } catch (error) {
          console.error('Error initializing drawing manager:', error);
        }
      } else {
        console.log('Drawing library not available:', {
          drawing: !!window.google.maps.drawing,
          mapInstance: googleMap instanceof window.google.maps.Map
        })
      }
    });
  }, [center, zoom, initialCenter]);

  // Update map center when an address is selected
  useEffect(() => {
    if (map) {
      map.setCenter(center)
      map.setZoom(zoom)
    }
  }, [center, zoom, map])
  
  const handlePolygonComplete = (polygon: any) => {
    if (drawnPolygon) {
      drawnPolygon.setMap(null);
    }
    setDrawnPolygon(polygon);

    // Keep drawing tool active for drawing additional polygons
    // Users can manually disable if they want to stop drawing
    
    calculateArea(polygon);

    // Add listener for when the polygon is edited
    polygon.getPath().addListener('set_at', () => calculateArea(polygon));
    polygon.getPath().addListener('insert_at', () => calculateArea(polygon));
  }

  const calculateArea = (polygon: any) => {
    if (!window.google?.maps?.geometry) return;
    
    const path = polygon.getPath()
    const areaInSquareMeters = window.google.maps.geometry.spherical.computeArea(path)
    
    // Convert to square feet (1 square meter = 10.7639 square feet)
    const areaInSquareFeet = areaInSquareMeters * 21.5278
    
    // Convert to "squares" (1 square = 100 square feet)
    const areaInSquares = areaInSquareFeet / 100
    
    setCalculatedArea(areaInSquares)
    setCalculatedSquareFeet(areaInSquareFeet)
  }

  const handleAddressSelect = (result: {
    place_name: string
    center: { lat: number; lng: number }
  }) => {
    setCenter(result.center)
    setZoom(20) // Zoom in close for rooftop viewing
    
    // Add or move marker to new address
    if (map && window.google) {
      if (addressMarker) {
        // Move existing marker
        addressMarker.setPosition(result.center);
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          position: result.center,
          map: map,
          title: `Property: ${result.place_name}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                <path fill="#ff0000" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }
        });
        setAddressMarker(marker);
      }
    }
  }
  
  const handleReset = () => {
    if (drawnPolygon) {
      drawnPolygon.setMap(null);
      setDrawnPolygon(null);
    }
    setCalculatedArea(null);
    setCalculatedSquareFeet(null);

    // Re-enable drawing tool (make it active again)
    if (drawingManager && window.google?.maps?.drawing) {
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      drawingManager.setOptions({
          drawingControl: true
      });
    }
  }

  return (
    <Card className="w-full h-full flex flex-col bg-black/30 border-white/20 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lime-400 text-lg sm:text-xl">Roof Area Estimator</CardTitle>
        <div className="pt-2">
          <AddressSearch onAddressSelect={handleAddressSelect} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-3 sm:gap-4">
        {/* Mobile-first layout: Map takes most of the space */}
        <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] rounded-lg relative">
          {!isGoogleMapsReady ? (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-lg">
              <div className="text-white text-sm sm:text-base">Loading Google Maps...</div>
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full bg-gray-700 rounded-lg" style={{ minHeight: '300px' }} />
          )}
        </div>

        {/* Mobile-optimized controls section */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Results Card - Full width on mobile, takes more space on desktop */}
          <Card className="bg-slate-900/50 border border-slate-700/50 p-3 sm:p-4 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-lime-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Results</h3>
            </div>
            {calculatedArea !== null && calculatedSquareFeet !== null ? (
              <div className="flex flex-row sm:flex-col gap-4 sm:gap-3">
                <div className="flex-1 text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-lime-400">
                    {calculatedSquareFeet.toFixed(0)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-300">Square Feet</p>
                </div>
                <div className="flex-1 text-center border-l sm:border-l-0 sm:border-t border-gray-600 pl-4 sm:pl-0 sm:pt-3">
                  <p className="text-xl sm:text-2xl font-bold text-blue-400">
                    {calculatedArea.toFixed(2)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-300">Squares</p>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-400">
                Draw a polygon on the map to calculate the roof area.
              </p>
            )}
          </Card>

          {/* Controls - Compact on mobile */}
          <div className="flex flex-col gap-2 sm:w-48">
            <Button 
              onClick={handleReset} 
              variant="outline" 
              size="sm"
              className="w-full bg-transparent border-amber-500 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
              disabled={!drawingManager}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 