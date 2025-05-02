"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, memo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useMapContext } from "./map-context"

export interface MarkerData {
  id: string
  position: [number, number]
  address: string
  status?: string
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

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/invisionpjm/cm966bqbg00br01qugzbw7vef",
          center: [-82.91925, 42.668805], // Center of US
          zoom: 5,
          preserveDrawingBuffer: true, // Helps with rendering issues
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

        map.current.on("error", (e) => {
          console.error("Mapbox error:", e)
          setError("Error loading map. Please try again.")
          setIsLoading(false)
        })

        // Add click handler to add markers
        map.current.on("click", (e) => {
          const { lng, lat } = e.lngLat

          // Reverse geocode to get address
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.features && data.features.length > 0) {
                const address = data.features[0].place_name
                onMarkerAdd([lat, lng], address)
              }
            })
            .catch((error) => {
              console.error("Error reverse geocoding:", error)
              setError("Failed to get address. Please try again.")
            })
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

      // Use a debounce to prevent too frequent updates
      const updateMarkersTimeout = setTimeout(() => {
        console.log("Updating markers:", markers.length)

        // Clear existing markers
        Object.values(markersRef.current).forEach((marker) => marker.remove())
        markersRef.current = {}

        // Add new markers
        markers.forEach((markerData) => {
          const { id, position, status, address } = markerData
          const [lat, lng] = position

          // Create marker element
          const el = document.createElement("div")
          el.className = "custom-marker"
          el.setAttribute("data-address", address)
          el.setAttribute("data-status", status || "") // Add status attribute for debugging
          el.style.width = "25px"
          el.style.height = "25px"
          el.style.borderRadius = "50%"
          el.style.cursor = "pointer"

          // Set color based on status
          const color = getMarkerColor(status)
          el.style.backgroundColor = color
          console.log("Setting marker color:", { address, status, color }) // Debug log

          // Add border and shadow
          if (status !== "Search") {
            el.style.border = "2px solid white"
            el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)"
          }

          // Create and add the marker
          const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current!)

          // Add click handler
          marker.getElement().addEventListener("click", () => {
            onMarkerClick(markerData)
          })

          // Store reference
          markersRef.current[id] = marker
        })
      }, 100)

      return () => clearTimeout(updateMarkersTimeout)
    }, [markers, mapLoaded, onMarkerClick])

    // Helper function to get marker color
    const getMarkerColor = (status?: string) => {
      console.log("Getting color for status:", status) // Debug log
      switch (status) {
        case "No Answer":
          return "#3b82f6" // blue-500
        case "Not Interested":
          return "#ef4444" // red-500
        case "Inspected":
          return "#22c55e" // green-500
        case "Follow-up":
          return "#f59e0b" // amber-500
        case "In Contract":
          return "#6366f1" // indigo-500
        case "Search":
          return "#ec4899" // pink-500
        default:
          return "#6b7280" // gray-500
      }
    }

    // Listen for marker status updates
    useEffect(() => {
      const handleStatusUpdate = (event: CustomEvent<{ address: string; status: string }>) => {
        const { address, status } = event.detail
        console.log("Status update received:", { address, status }) // Debug log
        
        // Find all markers that match this address
        const matchingMarkers = Object.values(markersRef.current).filter(marker => 
          marker.getElement().getAttribute("data-address") === address
        )
        
        console.log("Matching markers found:", matchingMarkers.length) // Debug log
        
        matchingMarkers.forEach(marker => {
          const el = marker.getElement()
          const color = getMarkerColor(status)
          console.log("Updating marker color:", { address, status, color }) // Debug log
          el.style.backgroundColor = color
          el.setAttribute("data-status", status) // Update status attribute
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
