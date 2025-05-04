"use client"

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, memo } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { useMapContext } from "./map-context"
import { getMarkerColor } from "@/lib/utils"
import { PropertyVisitStatus } from "./MapInteractionDrawer"

export interface MarkerData {
  id: string
  position: [number, number]
  address: string
  status: PropertyVisitStatus | "New" | "Search"
  visits?: any[]
  leadId?: string
}

interface GoogleMapProps {
  markers: MarkerData[]
  onMarkerClick: (marker: MarkerData) => void
  onMarkerAdd: (position: [number, number], address: string) => void
  apiKey: string
  searchResult?: { position: [number, number]; address: string } | null
}

const GoogleMap = memo(
  forwardRef<any, GoogleMapProps>(({ markers, onMarkerClick, onMarkerAdd, apiKey, searchResult }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<google.maps.Map | null>(null)
    const markersRef = useRef<{ [key: string]: google.maps.Marker }>({})
    const [mapLoaded, setMapLoaded] = useState(false)
    const { setIsLoading, setError, setLocation } = useMapContext()
    const initializedRef = useRef(false)
    const markersAppliedRef = useRef(false)

    // Initialize map only once
    useEffect(() => {
      if (!mapContainer.current || initializedRef.current) return

      console.log("Initializing Google Map")
      setIsLoading(true)
      initializedRef.current = true

      const loader = new Loader({
        apiKey,
        version: "weekly",
        libraries: ["places", "geocoding"],
      })

      loader
        .load()
        .then((google) => {
          if (!mapContainer.current) return

          map.current = new google.maps.Map(mapContainer.current, {
            center: { lat: 42.668805, lng: -82.91925 }, // Center of US
            zoom: 5,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          })

          // Add click handler to add markers
          map.current.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return

            const geocoder = new google.maps.Geocoder()
            geocoder.geocode(
              {
                location: e.latLng,
              },
              (results, status) => {
                if (status === "OK" && results?.[0]) {
                  onMarkerAdd([e.latLng!.lat(), e.latLng!.lng()], results[0].formatted_address)
                }
              },
            )
          })

          // Update context with current map center
          map.current.addListener("idle", () => {
            if (map.current) {
              const center = map.current.getCenter()
              if (center) {
                setLocation({ lat: center.lat(), lng: center.lng() })
              }
            }
          })

          setMapLoaded(true)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error loading Google Maps:", error)
          setError("Failed to load Google Maps. Please check your connection and try again.")
          setIsLoading(false)
          initializedRef.current = false
        })
    }, [apiKey, setIsLoading, setError, setLocation, onMarkerAdd])

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      flyTo: (position: [number, number], zoom = 15) => {
        if (map.current) {
          map.current.panTo({ lat: position[0], lng: position[1] })
          map.current.setZoom(zoom)
        }
      },
      getMap: () => map.current,
    }))

    // Update markers when they change
    useEffect(() => {
      if (!mapLoaded || !map.current) return

      // Clear existing markers
      Object.values(markersRef.current).forEach((marker) => marker.setMap(null))
      markersRef.current = {}

      // Add new markers
      markers.forEach((markerData) => {
        const { id, position, status } = markerData
        const [lat, lng] = position

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: map.current,
          title: markerData.address,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: getMarkerColor(status),
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
          },
        })

        // Add click handler
        marker.addListener("click", () => {
          onMarkerClick(markerData)
        })

        // Store reference
        markersRef.current[id] = marker
      })

      // If this is the first time adding markers, center the map on the first marker
      if (!markersAppliedRef.current && markers.length > 0) {
        const firstMarker = markers[0]
        map.current.panTo({ lat: firstMarker.position[0], lng: firstMarker.position[1] })
        map.current.setZoom(15)
        markersAppliedRef.current = true
      }
    }, [markers, mapLoaded, onMarkerClick])

    // Handle search result changes
    useEffect(() => {
      if (map.current && searchResult) {
        const { position } = searchResult
        map.current.panTo({ lat: position[0], lng: position[1] })
        map.current.setZoom(18)
      }
    }, [searchResult])

    return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />
  }),
)

GoogleMap.displayName = "GoogleMap"

export default GoogleMap 