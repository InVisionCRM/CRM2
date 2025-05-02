"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import MapboxMap from "@/components/map/mapbox-map"
import { AddressSearch } from "@/components/map/address-search"
import CrmLeadCardModal from "@/components/crm-lead-card-modal"
import type { MarkerData } from "@/components/map/mapbox-map"

export default function MapPage() {
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [selectedAddress, setSelectedAddress] = useState("")
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const mapRef = useRef<any>(null)
  const { toast } = useToast()

  // Use a stable ref for search results to avoid re-renders
  const searchResultRef = useRef<{
    position: [number, number]
    address: string
  } | null>(null)

  // Fetch markers only once on mount
  useEffect(() => {
    fetchMarkers()
  }, [])

  // Function to fetch markers from the API
  const fetchMarkers = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching markers from API...")
      const response = await fetch("/api/vision-markers")

      if (!response.ok) {
        console.error("Failed to fetch markers:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Failed to fetch markers: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Markers API response:", data)

      if (data.markers) {
        const formattedMarkers: MarkerData[] = data.markers.map((m: any) => ({
          id: m.id,
          position: [m.lat, m.lng],
          address: m.address,
          status: m.status || "New",
          visits: m.visits || [],
        }))

        console.log("Formatted markers:", formattedMarkers)
        setMarkers(formattedMarkers)
      } else {
        console.warn("No markers found in API response")
        setMarkers([])
      }
    } catch (error) {
      console.error("Failed to fetch markers:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load map markers. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Use useCallback to ensure these functions don't change on re-renders
  const handleMarkerClick = useCallback((marker: MarkerData) => {
    console.log("Marker clicked:", marker)
    setSelectedAddress(marker.address)
    setSelectedPosition(marker.position)
    setSelectedMarkerId(marker.id)
    setModalOpen(true)
  }, [])

  const handleMarkerAdd = useCallback((position: [number, number], address: string) => {
    console.log("Adding marker at position:", position, "address:", address)

    // Create a temporary marker ID
    const tempId = `temp-${Date.now()}`

    // Add a temporary marker to the local state immediately
    const newMarker: MarkerData = {
      id: tempId,
      position: position,
      address: address,
      status: "New",
    }

    setMarkers((prevMarkers) => [...prevMarkers, newMarker])

    // Set up the modal with the new marker details
    setSelectedAddress(address)
    setSelectedPosition(position)
    setSelectedMarkerId(tempId) // Use the temporary ID
    setModalOpen(true)
  }, [])

  // Function to handle address selection from search
  const handleAddressSelect = useCallback((result: any) => {
    if (result && result.center) {
      console.log("Address selected:", result)

      // Note: Mapbox returns coordinates as [lng, lat]
      const position: [number, number] = [result.center[0], result.center[1]]
      const address = result.place_name

      // Store in ref to avoid re-renders
      searchResultRef.current = { position, address }

      // Create a temporary search marker
      const searchMarkerId = `search-${Date.now()}`
      const newSearchMarker: MarkerData = {
        id: searchMarkerId,
        position,
        address,
        status: "Search", // Special status for search markers
      }

      // Update markers with the new search marker
      setMarkers((prevMarkers) => {
        // Remove any previous search markers
        const filteredMarkers = prevMarkers.filter((m) => !m.id.startsWith("search-"))
        return [...filteredMarkers, newSearchMarker]
      })

      // If we have a reference to the map component, we can also call its methods
      if (mapRef.current && mapRef.current.flyTo) {
        mapRef.current.flyTo(position, 18) // Zoom level 18 for closer view
      }
    }
  }, [])

  const handleModalClose = useCallback(async () => {
    console.log("Modal closed, refreshing markers...")
    setModalOpen(false)
    // Fetch new markers without resetting the map
    await fetchMarkers()
  }, [])

  return (
    <div className="fullscreen-map-container relative [color-scheme:light]">
      {/* Search bar positioned at the top center of the map */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
        <AddressSearch onAddressSelect={handleAddressSelect} />
      </div>

      {/* Use a stable key to prevent re-mounting */}
      <MapboxMap
        key="stable-map-instance"
        ref={mapRef}
        markers={markers}
        onMarkerClick={handleMarkerClick}
        onMarkerAdd={handleMarkerAdd}
        searchResult={searchResultRef.current}
        accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
      />

      {modalOpen && selectedPosition && (
        <CrmLeadCardModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          address={selectedAddress}
          position={selectedPosition}
          markerId={selectedMarkerId}
        />
      )}
    </div>
  )
}
