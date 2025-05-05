"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { MapProvider } from "./map-context"
import MapboxMap from "./mapbox-map"
import type { MarkerData } from "./mapbox-map"

interface MapboxWrapperProps {
  markers: MarkerData[]
  onMarkerClick: (marker: MarkerData) => void
  onMarkerAdd: (position: [number, number], address: string) => void
  accessToken: string
  searchResult?: { position: [number, number]; address: string } | null
}

// This wrapper component ensures the map doesn't re-render unnecessarily
const MapboxWrapper = forwardRef<any, MapboxWrapperProps>(
  ({ markers, onMarkerClick, onMarkerAdd, accessToken, searchResult }, ref) => {
    const mapRef = useRef<any>(null)

    // Forward methods from the inner MapboxMap component
    useImperativeHandle(ref, () => ({
      flyTo: (position: [number, number], zoom = 15) => {
        if (mapRef.current && mapRef.current.flyTo) {
          mapRef.current.flyTo(position, zoom)
        }
      },
      getMap: () => {
        if (mapRef.current && mapRef.current.getMap) {
          return mapRef.current.getMap()
        }
        return null
      },
    }))

    return (
      <MapProvider>
        <MapboxMap
          ref={mapRef}
          markers={markers}
          onMarkerClick={onMarkerClick}
          onMarkerAdd={onMarkerAdd}
          accessToken={accessToken}
          searchResult={searchResult}
        />
      </MapProvider>
    )
  },
)

MapboxWrapper.displayName = "MapboxWrapper"

export default MapboxWrapper