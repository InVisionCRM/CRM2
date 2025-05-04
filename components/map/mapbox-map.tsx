"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, memo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useMapContext } from "./map-context"
import { getMarkerColor } from "@/lib/utils"
import { PropertyVisitStatus } from "@/components/map/MapInteractionDrawer"

// Simple address normalization helper
function normalizeAddress(address: string): string {
  if (!address) return "";
  return address.toLowerCase().trim().replace(/\s+/g, ' '); // Lowercase, trim, collapse whitespace
}

export interface MarkerData {
  id: string
  position: [number, number]
  address: string
  status: PropertyVisitStatus | "New" | "Search"
  visits?: any[]
}

interface MapboxMapProps {
  markers: MarkerData[]
  onMarkerClick: (marker: MarkerData) => void
  onMarkerAdd: (position: [number, number], address: string) => void
  accessToken: string
  searchResult?: { position: [number, number]; address: string } | null
}

// Use memo to prevent unnecessary re-renders
const MapboxMap = memo(
  forwardRef<any, MapboxMapProps>(({ markers, onMarkerClick, onMarkerAdd, accessToken, searchResult }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<mapboxgl.Map | null>(null)
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
    const [mapLoaded, setMapLoaded] = useState(false)
    const { setIsLoading, setError, setLocation } = useMapContext()
    const initializedRef = useRef(false)
    const markersAppliedRef = useRef(false)

    // Initialize map only once
    useEffect(() => {
      if (!mapContainer.current || initializedRef.current) return

      console.log("Initializing map")
      setIsLoading(true)
      initializedRef.current = true

      try {
        mapboxgl.accessToken = accessToken

        // Configure Mapbox to use transformRequest for CORS
        const transformRequest = (url: string, resourceType?: string) => {
          // Add specific handling for style URLs
          if (url.includes('mapbox.com')) {
            return {
              url: url,
              headers: {
                'Origin': window.location.origin
              }
            }
          }
          return { url }
        }

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12", // Use public style instead of custom style
          center: [-82.91925, 42.668805],
          zoom: 5,
          preserveDrawingBuffer: true,
          transformRequest,
        })

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
        map.current.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
            },
            trackUserLocation: true,
          }),
          "top-right",
        )

        map.current.on("load", () => {
          console.log("Map loaded successfully")
          setMapLoaded(true)
          setIsLoading(false)
        })

        // Add detailed error logging
        map.current.on('error', (e: { error: Error & { status?: number } }) => {
          console.error('Mapbox error:', {
            error: e.error,
            message: e.error.message,
            status: e.error.status,
            stack: e.error.stack
          });
          
          if (e.error.message?.includes('style')) {
            setError('Unable to load map style. Trying to recover...');
            // Try to fallback to a different style
            if (map.current) {
              map.current.setStyle('mapbox://styles/mapbox/light-v11');
            }
          } else if (e.error.status === 401) {
            setError('Map authentication failed. Please check your access token.');
          } else if (e.error.status === 403) {
            setError('Access to map resources denied. Please check domain restrictions.');
          } else {
            setError('An error occurred while loading the map.');
          }
          setIsLoading(false);
        });

        // Add events error handler
        map.current.on('style.load', () => {
          try {
            const style = map.current?.getStyle();
            const eventsSource = style?.sources?.events as mapboxgl.AnySourceImpl;
            if (eventsSource) {
              (eventsSource as any).on?.('error', (e: Error) => {
                console.warn('Mapbox events error:', e);
                // Suppress events errors as they are non-critical
              });
            }
          } catch (err) {
            console.warn('Error setting up events error handler:', err);
          }
        });

        // Add click handler to add markers or select existing based on address
        map.current.on("click", async (e) => {
          if (!map.current) return; // Ensure map exists

          // Check if the click was on an existing marker feature (prevent double handling)
          const features = map.current.queryRenderedFeatures(e.point, {
            layers: ['markers-layer'] // Assuming you create a layer named 'markers-layer' for marker elements
          });
          // Or, if not using layers, check if the click target is one of our custom markers
          let clickedOnMarker = false;
          if (e.originalEvent.target instanceof HTMLElement) {
            clickedOnMarker = e.originalEvent.target.closest('.custom-marker') !== null;
          }

          if (features && features.length > 0 || clickedOnMarker) {
            console.log("Clicked on an existing marker element, `onMarkerClick` will handle.");
            return; // Let the marker's own click handler manage it
          }

          // --- Click was on the base map --- 
          const { lng, lat } = e.lngLat;
          setIsLoading(true); // Show loading state during geocoding
          setError(null); // Clear previous errors

          try {
            // Reverse geocode to get address
            const geoResponse = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&access_token=${accessToken}`);
            if (!geoResponse.ok) {
              throw new Error(`Reverse geocoding failed: ${geoResponse.statusText}`);
            }
            const geoData = await geoResponse.json();

            if (!geoData.features || geoData.features.length === 0) {
                console.warn("No address found for clicked location.");
                setError("Could not find a specific address for this location.");
                setIsLoading(false);
                return; 
            }

            const fetchedAddress = geoData.features[0].place_name;
            const normalizedFetchedAddress = normalizeAddress(fetchedAddress);

            console.log("Map clicked address:", fetchedAddress, "Normalized:", normalizedFetchedAddress);

            // Check if this address already exists in markers
            const existingMarker = markers.find(marker => 
              normalizeAddress(marker.address) === normalizedFetchedAddress
            );

            if (existingMarker) {
              console.log("Address matches existing marker, triggering onMarkerClick:", existingMarker);
              onMarkerClick(existingMarker); // Trigger click for existing marker
            } else {
              console.log("Address is new, triggering onMarkerAdd:", fetchedAddress);
              // Address doesn't exist, add a new one
              onMarkerAdd([lat, lng], fetchedAddress);
            }

          } catch (error) {
            console.error("Error during map click handling:", error);
            setError("Failed to get address details. Please try again.");
          } finally {
            setIsLoading(false);
          }
        })

        // Update context with current map center
        map.current.on("moveend", () => {
          if (map.current) {
            const center = map.current.getCenter()
            setLocation({ lat: center.lat, lng: center.lng })
          }
        })
      } catch (error) {
        console.error("Error initializing map:", error)
        setError("Failed to initialize map. Please check your connection and try again.")
        setIsLoading(false)
        initializedRef.current = false
      }

      // No cleanup function to prevent map from being removed
    }, [accessToken, setIsLoading, setError, setLocation, onMarkerAdd])

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      flyTo: (position: [number, number], zoom = 15) => {
        if (map.current) {
          try {
            map.current.flyTo({
              center: [position[1], position[0]], // [lng, lat]
              zoom: zoom,
              essential: true,
            })
          } catch (error) {
            console.error("Error in flyTo:", error)
          }
        }
      },
      getMap: () => map.current,
    }))

    // Update markers when they change
    useEffect(() => {
      if (!mapLoaded || !map.current) return

      const updateMarkersTimeout = setTimeout(() => {
        console.log("Updating markers:", markers.length)

        Object.values(markersRef.current).forEach((marker) => marker.remove())
        markersRef.current = {}

        markers.forEach((markerData) => {
          const { id, position, status, address } = markerData
          const [lat, lng] = position

          const el = document.createElement("div")
          el.className = "custom-marker"
          el.setAttribute("data-address", address)
          el.setAttribute("data-status", status || "")
          el.style.width = "25px"
          el.style.height = "25px"
          el.style.borderRadius = "50%"
          el.style.cursor = "pointer"

          const color = getMarkerColor(status)
          el.style.backgroundColor = color
          console.log("Setting marker color:", { address, status, color })

          if (status !== "Search") {
            el.style.border = "2px solid white"
            el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)"
          }

          const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current!)

          marker.getElement().addEventListener("click", () => {
            onMarkerClick(markerData)
          })

          markersRef.current[id] = marker
        })
      }, 100)

      return () => clearTimeout(updateMarkersTimeout)
    }, [markers, mapLoaded, onMarkerClick])

    // Listen for marker status updates
    useEffect(() => {
      const handleStatusUpdate = (event: CustomEvent<{ address: string; status: string }>) => {
        const { address, status } = event.detail
        console.log("Status update received:", { address, status })
        
        const matchingMarkers = Object.values(markersRef.current).filter(marker => 
          marker.getElement().getAttribute("data-address") === address
        )
        
        console.log("Matching markers found:", matchingMarkers.length)
        
        matchingMarkers.forEach(marker => {
          const el = marker.getElement()
          const color = getMarkerColor(status)
          console.log("Updating marker color:", { address, status, color })
          el.style.backgroundColor = color
          el.setAttribute("data-status", status)
        })
      }

      window.addEventListener('markerStatusUpdate', handleStatusUpdate as EventListener)
      return () => window.removeEventListener('markerStatusUpdate', handleStatusUpdate as EventListener)
    }, [])

    // Handle search result changes
    useEffect(() => {
      if (map.current && searchResult) {
        const { position } = searchResult
        map.current.flyTo({
          center: [position[1], position[0]], // [lng, lat]
          zoom: 18, // Closer zoom level
          essential: true,
        })
      }
    }, [searchResult])

    return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />
  }),
)

MapboxMap.displayName = "MapboxMap"

export default MapboxMap
