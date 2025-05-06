"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { MapProvider } from "./map-context"
import MapboxMap, { MapboxMarkerData, MapboxMapRef } from "./mapbox-map"
import mapboxgl from "mapbox-gl"

interface MapboxWrapperProps {
  markersData: MapboxMarkerData[]
  onMarkerClick: (marker: MapboxMarkerData) => void
  onMapClick: (position: [number, number], address?: string) => void
  accessToken: string
  initialCenter?: [number, number]
  initialZoom?: number
  mapStyle?: string
  searchResultMarker?: MapboxMarkerData | null
  showUserLocation?: boolean
}

// This wrapper component ensures the map doesn't re-render unnecessarily
const MapboxWrapper = forwardRef<MapboxMapRef, MapboxWrapperProps>(
  ({ markersData, onMarkerClick, onMapClick, accessToken, searchResultMarker, initialCenter, initialZoom, mapStyle, showUserLocation }, ref) => {
    const mapRef = useRef<MapboxMapRef>(null)

    // Forward methods from the inner MapboxMap component
    useImperativeHandle(ref, () => ({
      flyTo: (position: mapboxgl.LngLatLike, zoom = 15) => {
        if (mapRef.current && mapRef.current.flyTo) {
          mapRef.current.flyTo(position, zoom)
        }
      },
      getMapInstance: () => {
        if (mapRef.current && mapRef.current.getMapInstance) {
          return mapRef.current.getMapInstance()
        }
        return null
      },
      fitBounds: (bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => {
        if (mapRef.current && mapRef.current.fitBounds) {
          mapRef.current.fitBounds(bounds, options)
        }
      },
      addMarker: (markerData: MapboxMarkerData) => {
        if (mapRef.current && mapRef.current.addMarker) {
          mapRef.current.addMarker(markerData)
        }
      },
      removeMarker: (markerId: string) => {
        if (mapRef.current && mapRef.current.removeMarker) {
          mapRef.current.removeMarker(markerId)
        }
      },
      updateMarker: (markerData: MapboxMarkerData) => {
        if (mapRef.current && mapRef.current.updateMarker) {
          mapRef.current.updateMarker(markerData)
        }
      }
    }))

    return (
      <MapProvider>
        <MapboxMap
          ref={mapRef}
          markersData={markersData}
          onMarkerClick={onMarkerClick}
          onMapClick={onMapClick}
          accessToken={accessToken}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          mapStyle={mapStyle}
          searchResultMarker={searchResultMarker}
          showUserLocation={showUserLocation}
        />
      </MapProvider>
    )
  },
)

MapboxWrapper.displayName = "MapboxWrapper"

export default MapboxWrapper