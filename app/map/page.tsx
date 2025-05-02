"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import MapboxMap from "@/components/map/mapbox-map"
import { AddressSearch } from "@/components/map/address-search"
import { MapInteractionDrawer } from "@/components/map/MapInteractionDrawer"
import type { MarkerData } from "@/components/map/mapbox-map"

// Define a type for the data needed by the drawer
interface DrawerData {
  address: string
  position: [number, number]
  markerId?: string
  currentStatus?: string
  streetViewUrl?: string
}

export default function MapPage() {
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedDrawerData, setSelectedDrawerData] = useState<DrawerData | null>(null)
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)
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
          position: [m.latitude, m.longitude],
          address: m.address,
          status: m.status || "New",
          visits: m.visits || [],
        }))

        console.log("Formatted markers with correct position mapping:", formattedMarkers)
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
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${marker.position[0]},${marker.position[1]}&key=YOUR_GOOGLE_MAPS_API_KEY&return_error_codes=true` // Replace YOUR_GOOGLE_MAPS_API_KEY

    setSelectedDrawerData({
      address: marker.address,
      position: marker.position,
      markerId: marker.id,
      currentStatus: marker.status, // Assuming status is on MarkerData
      streetViewUrl: streetViewUrl, // Add fetched/constructed URL
    })
    setIsDrawerExpanded(false) // Start collapsed
    setIsDrawerOpen(true)
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
      status: "New", // Default status for a new potential marker
    }

    setMarkers((prevMarkers) => [...prevMarkers, newMarker])

    // Set up the drawer with the new marker details
    // TODO: Implement logic to get Street View URL
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${position[0]},${position[1]}&key=YOUR_GOOGLE_MAPS_API_KEY&return_error_codes=true` // Replace YOUR_GOOGLE_MAPS_API_KEY

    setSelectedDrawerData({
      address: address,
      position: position,
      markerId: tempId, // Use the temporary ID
      currentStatus: undefined, // No status selected yet for a new location
      streetViewUrl: streetViewUrl,
    })
    setIsDrawerExpanded(false) // Start collapsed
    setIsDrawerOpen(true)
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

  // TODO: Implement actual status saving logic (e.g., call Server Action)
  const handleStatusChange = useCallback((newStatus: string) => {
    if (!selectedDrawerData) return

    console.log(`Status changed for ${selectedDrawerData.address} to: ${newStatus}`)

    // Update local state immediately for UI feedback
    setSelectedDrawerData(prevData => prevData ? { ...prevData, currentStatus: newStatus } : null)

    // Update the marker in the main markers array
    setMarkers(prevMarkers => prevMarkers.map(m => 
      m.id === selectedDrawerData.markerId ? { ...m, status: newStatus } : m
    ))

    // Optionally: Dispatch custom event for mapbox-map to update color instantly
    window.dispatchEvent(new CustomEvent('markerStatusUpdate', { 
      detail: { address: selectedDrawerData.address, status: newStatus }
    }));

    // Future: Add API call here to persist the status change
    // Example: updateVisitStatusAction(selectedDrawerData.markerId || selectedDrawerData.address, newStatus)
    toast({ title: "Status Updated", description: `Status set to ${newStatus}` })

  }, [selectedDrawerData]) // Dependency on selectedDrawerData

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

      {isDrawerOpen && selectedDrawerData && (
        <MapInteractionDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedDrawerData(null)
            setIsDrawerExpanded(false) // Ensure it collapses on close
          }}
          // Pass individual props from selectedDrawerData
          address={selectedDrawerData.address}
          streetViewUrl={selectedDrawerData.streetViewUrl}
          currentStatus={selectedDrawerData.currentStatus}
          // Pass available statuses (customize this list as needed)
          availableStatuses={["No Answer", "Not Home", "Not Interested", "Come Back Later", "Appointment Set", "Signed Contract"]}
          onStatusChange={handleStatusChange} 
          // Expansion control props
          isExpanded={isDrawerExpanded}
          onExpand={() => setIsDrawerExpanded(true)}
          onCollapse={() => setIsDrawerExpanded(false)} // Pass the collapse handler
        />
      )}
    </div>
  )
}
