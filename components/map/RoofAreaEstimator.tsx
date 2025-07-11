"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Redo, Trash2, Plus, Home } from "lucide-react"

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

interface Structure {
  id: string;
  polygon: any;
  area: number;
  squareFeet: number;
  name: string;
}

const COMPLEXITY_MULTIPLIERS = {
  simple: { value: 1.0, label: "Simple (Flat/Single Pitch)", description: "Minimal waste, simple cuts" },
  moderate: { value: 1.15, label: "Moderate (Hip/Gable)", description: "Some complexity, standard ridges" },
  complex: { value: 1.3, label: "Complex (Multiple Ridges)", description: "Multiple angles, valleys, dormers" },
  very_complex: { value: 1.5, label: "Very Complex (Steep/Intricate)", description: "High pitch, many cuts, complex geometry" },
}

export function RoofAreaEstimator({ initialCenter, initialZoom = 5 }: RoofAreaEstimatorProps) {
  const [map, setMap] = useState<any>(null)
  const [drawingManager, setDrawingManager] = useState<any>(null)
  const [structures, setStructures] = useState<Structure[]>([])
  const [structureCounter, setStructureCounter] = useState(1)
  const [complexityMultiplier, setComplexityMultiplier] = useState<keyof typeof COMPLEXITY_MULTIPLIERS>('moderate')
  const [center, setCenter] = useState(initialCenter || { lat: 39.8283, lng: -98.5795 }) // Default center of the US
  const [zoom, setZoom] = useState(initialCenter ? 20 : initialZoom)
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false)
  const [addressMarker, setAddressMarker] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Update center and zoom when initialCenter prop changes
  useEffect(() => {
    console.log('RoofAreaEstimator - initialCenter prop changed:', initialCenter)
    if (initialCenter) {
      console.log('Setting center to:', initialCenter, 'and zoom to: 20')
      setCenter(initialCenter)
      setZoom(20) // Zoom in close for rooftop viewing when we have coordinates
      
      // If map is already initialized, update it immediately
      if (map) {
        console.log('Map already exists, updating center and marker')
        map.setCenter(initialCenter)
        map.setZoom(20)
        
        // Update or create marker
        if (addressMarker) {
          addressMarker.setPosition(initialCenter)
        } else {
          const marker = new window.google.maps.Marker({
            position: initialCenter,
            map: map,
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
        }
      }
    }
  }, [initialCenter, map, addressMarker])

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
    console.log('Map initialization effect - isGoogleMapsReady:', isGoogleMapsReady, 'center:', center, 'zoom:', zoom)
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

    console.log('Initializing Google Map with simplified controls...')
    console.log('Map will be centered at:', center, 'with zoom:', zoom)
    console.log('initialCenter prop is:', initialCenter)

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: 'satellite',
      tilt: 0, // Always top-down view
      // Minimal controls - remove most UI elements
      mapTypeControl: false,
      zoomControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      // Disable restrictions
      restriction: null,
      disableDefaultUI: false,
      minZoom: 1,
      maxZoom: 22,
      // Prevent map gestures from interfering with drawer on mobile
      gestureHandling: 'greedy',
    });
    
    // Wait for the map to be fully loaded before setting up drawing manager
    window.google.maps.event.addListenerOnce(googleMap, 'idle', () => {
      setMap(googleMap);

      // Always add marker for the address location (either initial or current center)
      const markerPosition = initialCenter || center;
      console.log('Creating marker at position:', markerPosition)
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
              position: window.google.maps.ControlPosition.LEFT_CENTER,
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
    if (!window.google?.maps?.geometry) return;
    
    const path = polygon.getPath()
    const areaInSquareMeters = window.google.maps.geometry.spherical.computeArea(path)
    
    // Convert to square feet (1 square meter = 10.7639 square feet)
    const areaInSquareFeet = areaInSquareMeters * 10.7639
    
    // Convert to "squares" (1 square = 100 square feet)
    const areaInSquares = areaInSquareFeet / 100
    
    // Create new structure
    const newStructure: Structure = {
      id: `structure-${Date.now()}-${structureCounter}`,
      polygon: polygon,
      area: areaInSquares,
      squareFeet: areaInSquareFeet,
      name: `Structure ${structureCounter}`
    }
    
    // Add to structures array
    setStructures(prev => [...prev, newStructure])
    setStructureCounter(prev => prev + 1)

    // Keep drawing tool active for drawing additional polygons
    // Users can manually disable if they want to stop drawing
    
    // Add listener for when the polygon is edited
    polygon.getPath().addListener('set_at', () => updateStructureArea(newStructure.id, polygon));
    polygon.getPath().addListener('insert_at', () => updateStructureArea(newStructure.id, polygon));
  }

  const updateStructureArea = (structureId: string, polygon: any) => {
    if (!window.google?.maps?.geometry) return;
    
    const path = polygon.getPath()
    const areaInSquareMeters = window.google.maps.geometry.spherical.computeArea(path)
    
    // Convert to square feet (1 square meter = 10.7639 square feet)
    const areaInSquareFeet = areaInSquareMeters * 10.7639
    
    // Convert to "squares" (1 square = 100 square feet)
    const areaInSquares = areaInSquareFeet / 100
    
    setStructures(prev => prev.map(structure => 
      structure.id === structureId 
        ? { ...structure, area: areaInSquares, squareFeet: areaInSquareFeet }
        : structure
    ))
  }

  const calculateTotals = () => {
    const totalSquareFeet = structures.reduce((sum, structure) => sum + structure.squareFeet, 0)
    const totalSquares = structures.reduce((sum, structure) => sum + structure.area, 0)
    const multiplier = COMPLEXITY_MULTIPLIERS[complexityMultiplier].value
    
    return {
      totalSquareFeet,
      totalSquares,
      adjustedSquareFeet: totalSquareFeet * multiplier,
      adjustedSquares: totalSquares * multiplier,
      multiplier
    }
  }

  const calculateArea = (polygon: any) => {
    // This function is no longer used with the new multi-structure system
    // Keeping it for backward compatibility during transition
    return;
  }

  const handleReset = () => {
    // Clear all structures from the map
    structures.forEach(structure => {
      if (structure.polygon) {
        structure.polygon.setMap(null);
      }
    });
    
    // Clear structures array
    setStructures([]);
    setStructureCounter(1);

    // Re-enable drawing tool (make it active again)
    if (drawingManager && window.google?.maps?.drawing) {
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      drawingManager.setOptions({
          drawingControl: true
      });
    }
  }

  const handleRemoveStructure = (structureId: string) => {
    const structureToRemove = structures.find(s => s.id === structureId);
    if (structureToRemove && structureToRemove.polygon) {
      structureToRemove.polygon.setMap(null);
    }
    setStructures(prev => prev.filter(s => s.id !== structureId));
  }

  const handleAddStructure = () => {
    // Simply re-enable drawing mode - user can draw new polygon
    if (drawingManager && window.google?.maps?.drawing) {
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      drawingManager.setOptions({
          drawingControl: true
      });
    }
  }

  return (
    <Card className="w-full h-full flex flex-col bg-black/30 border-white/20 text-white">
      <CardContent className="flex-grow flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 overflow-y-auto">
        {/* Mobile-first layout: Map takes most of the space */}
        <div className="w-full h-[40vh] sm:h-[50vh] md:h-[60vh] rounded-lg relative flex-shrink-0">
          {!isGoogleMapsReady ? (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-lg">
              <div className="text-white text-sm sm:text-base">Loading Google Maps...</div>
            </div>
          ) : (
            <div 
              ref={mapRef} 
              className="w-full h-full bg-gray-700 rounded-lg" 
              style={{ minHeight: '300px' }}
              onTouchStart={(e) => {
                // Only prevent propagation for map interactions, not UI elements
                const target = e.target as HTMLElement;
                if (target.closest('.gm-style')) {
                  e.stopPropagation();
                }
              }}
              onTouchMove={(e) => {
                // Only prevent propagation for map interactions, not UI elements
                const target = e.target as HTMLElement;
                if (target.closest('.gm-style')) {
                  e.stopPropagation();
                }
              }}
              onTouchEnd={(e) => {
                // Only prevent propagation for map interactions, not UI elements
                const target = e.target as HTMLElement;
                if (target.closest('.gm-style')) {
                  e.stopPropagation();
                }
              }}
            />
          )}
        </div>

        {/* Mobile-optimized controls section */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Complexity Multiplier Selector */}
          <Card className="bg-slate-900/50 border border-slate-700/50 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">Roof Complexity</h3>
            </div>
            <Select value={complexityMultiplier} onValueChange={(value) => setComplexityMultiplier(value as keyof typeof COMPLEXITY_MULTIPLIERS)}>
              <SelectTrigger className="w-full bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Select roof complexity" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {Object.entries(COMPLEXITY_MULTIPLIERS).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-slate-700">
                    <div className="flex flex-col">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-xs text-gray-400">{config.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-2">
              Multiplier: {COMPLEXITY_MULTIPLIERS[complexityMultiplier].value}x
            </p>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Results Card - Enhanced with totals and multiplier */}
            <Card className="bg-slate-900/50 border border-slate-700/50 p-3 sm:p-4 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-lime-400" />
                <h3 className="text-lg sm:text-xl font-bold text-white">Total Results</h3>
              </div>
              
              {structures.length > 0 ? (
                <div className="space-y-4">
                  {/* Individual Structures */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Individual Structures:</h4>
                    {structures.map((structure, index) => (
                      <div key={structure.id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded">
                        <div className="flex-1">
                          <span className="text-sm text-white">{structure.name}</span>
                          <div className="text-xs text-gray-400">
                            {structure.squareFeet.toFixed(0)} sq ft • {structure.area.toFixed(2)} squares
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveStructure(structure.id)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Total Raw Measurements */}
                  <div className="border-t border-slate-600 pt-3">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-lime-400">
                          {calculateTotals().totalSquareFeet.toFixed(0)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">Raw Sq Ft</p>
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-blue-400">
                          {calculateTotals().totalSquares.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">Raw Squares</p>
                      </div>
                    </div>
                  </div>

                  {/* Adjusted Measurements with Multiplier */}
                  <div className="border-t border-slate-600 pt-3">
                    <div className="text-center mb-2">
                      <p className="text-xs text-orange-400 font-medium">
                        With {COMPLEXITY_MULTIPLIERS[complexityMultiplier].value}x Complexity Factor
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold text-orange-400">
                          {calculateTotals().adjustedSquareFeet.toFixed(0)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">Adjusted Sq Ft</p>
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-orange-500">
                          {calculateTotals().adjustedSquares.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">Adjusted Squares</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-400">
                  Use the polygon tool on the left side of the map to draw and calculate roof area.
                </p>
              )}
            </Card>

            {/* Enhanced Controls */}
            <div className="flex flex-col gap-2 sm:w-48">
              <Button 
                onClick={handleAddStructure} 
                variant="outline" 
                size="sm"
                className="w-full bg-transparent border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                disabled={!drawingManager}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Add Structure
              </Button>
              
              <Button 
                onClick={handleReset} 
                variant="outline" 
                size="sm"
                className="w-full bg-transparent border-amber-500 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                disabled={!drawingManager || structures.length === 0}
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> Clear All
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 