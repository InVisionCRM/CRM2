"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
// import MapboxMap from "@/components/map/mapbox-map" // Remove Mapbox import
import GoogleMap from "@/components/map/google-map" // Add GoogleMap import
import { AddressSearch } from "@/components/map/address-search"
// Adjust MarkerData if needed, though [lat, lng] seems compatible with google-map.tsx
// Keep original MarkerData for now, as google-map.tsx uses it for callbacks
// import type { MarkerData } from "@/components/map/mapbox-map" // Keep this type for now -- REMOVE THIS
import type { MarkerData } from "@/components/map/google-map" // Import MarkerData from google-map
import { PropertyVisitStatus } from "@/components/map/types"
import { DoorOpen } from 'lucide-react'; // Icon for counter
import { SimpleMapCardModal } from "@/components/map/SimpleMapCardModal"
// Import function to get session client-side if needed, or assume session info is available
// import { useSession } from "next-auth/react" 

// Helper function to validate status from API
function isValidStatus(status: any): status is PropertyVisitStatus | "New" | "Search" {
  const validStatuses: Array<PropertyVisitStatus | "New" | "Search"> = [
    "No Answer",
    "Not Interested",
    "Follow up",
    "Inspected",
    "In Contract",
    "New",
    "Search",
  ]
  return typeof status === 'string' && validStatuses.includes(status as any);
}

// Define a type for the data needed by the modal
interface ModalData {
  address: string
  position: [number, number] // [lat, lng]
  markerId?: string
  currentStatus?: PropertyVisitStatus | "New" | "Search"
  streetViewUrl?: string
  leadId?: string
}

export default function MapPage() {
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedModalData, setSelectedModalData] = useState<ModalData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [knockCount, setKnockCount] = useState<number | null>(null)
  const mapRef = useRef<any>(null) // Keep ref as any for now
  const { toast } = useToast()
  // const { data: session } = useSession(); // Example if using next-auth client hook

  // Search result structure from Google Places
  const searchResultRef = useRef<{
    position: [number, number] // [lat, lng]
    address: string
  } | null>(null)

  // Fetch initial data (markers and knock count)
  useEffect(() => {
    console.log("Google Maps API Key:", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    fetchMarkers();
    fetchKnockCount(); // Fetch count on mount
  }, []);

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
        const formattedMarkers: MarkerData[] = data.markers.map((m: any) => {
           // Validate the status from the API, default to 'New' if invalid or missing
          const validatedStatus = isValidStatus(m.status) ? m.status : "New";

          return {
              id: m.id,
              position: [m.latitude, m.longitude], // API provides lat, lng
              address: m.address,
              status: validatedStatus,
              visits: m.visits || [],
              leadId: m.leadId,
          }
        })

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

  // Function to fetch knock count
  const fetchKnockCount = async () => {
    try {
        const response = await fetch("/api/users/knock-stats");
        if (!response.ok) {
            // Handle non-2xx responses gracefully (e.g., user not logged in?)
            if (response.status === 401) {
                console.warn("User not logged in, cannot fetch knock count.");
                setKnockCount(0); // Or null, depending on desired display for logged-out users
            } else {
                throw new Error("Failed to fetch knock count");
            }
        } else {
            const data = await response.json();
            setKnockCount(data.count);
        }
    } catch (error) {
        console.error("Error fetching knock count:", error);
        // Optionally show a toast, but might be too noisy
        setKnockCount(null); // Indicate error state
    }
  };

  // handleMarkerClick - Google Map component passes the original MarkerData back
  // Street view URL uses position[0] (lat), position[1] (lng) correctly
  const handleMarkerClick = useCallback((marker: MarkerData) => {
    console.log("Marker clicked:", marker)
    // Ensure the Google Maps API key is used here
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${marker.position[0]},${marker.position[1]}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&return_error_codes=true`

    setSelectedModalData({
      address: marker.address,
      position: marker.position, // [lat, lng]
      markerId: marker.id,
      currentStatus: marker.status,
      streetViewUrl: streetViewUrl,
      leadId: marker.leadId
    })
    setIsModalOpen(true)
  }, [])

  // handleMarkerAdd - Google Map component passes [lat, lng] and address
  const handleMarkerAdd = useCallback((position: [number, number], address: string) => {
    console.log("Adding marker at position:", position, "address:", address) // position is [lat, lng]

    const tempId = `temp-${Date.now()}`
    const newMarker: MarkerData = {
      id: tempId,
      position: position, // [lat, lng]
      address: address,
      status: "New",
      leadId: tempId,
    }

    setMarkers((prevMarkers) => [...prevMarkers, newMarker])

    // Use Google Maps API key for Street View
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${position[0]},${position[1]}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&return_error_codes=true`

    setSelectedModalData({
      address: address,
      position: position, // [lat, lng]
      markerId: tempId,
      currentStatus: undefined,
      streetViewUrl: streetViewUrl,
      leadId: tempId,
    })
    setIsModalOpen(true)
  }, [])

  // handleAddressSelect - updated AddressSearch passes { place_name: string, center: { lat, lng } }
  const handleAddressSelect = useCallback((result: {
    place_name: string
    center: { lat: number; lng: number }
  }) => {
    if (result && result.center) {
      console.log("Address selected (Google):", result)

      // Extract lat/lng and format as [lat, lng] array
      const position: [number, number] = [result.center.lat, result.center.lng]
      const address = result.place_name

      // Store in ref
      searchResultRef.current = { position, address }

      // Create temporary search marker
      const searchMarkerId = `search-${Date.now()}`
      const newSearchMarker: MarkerData = {
        id: searchMarkerId,
        position, // [lat, lng]
        address,
        status: "Search",
        leadId: searchMarkerId,
      }

      // Update markers state
      setMarkers((prevMarkers) => {
        const filteredMarkers = prevMarkers.filter((m) => !m.id.startsWith("search-"))
        return [...filteredMarkers, newSearchMarker]
      })

      // Fly to location using GoogleMap's flyTo method
      if (mapRef.current && mapRef.current.flyTo) {
        mapRef.current.flyTo(position, 18) // Pass [lat, lng]
      }
    }
  }, [])

  // handleStatusChange - logic remains mostly the same
  // API calls use position[0] (lat), position[1] (lng)
  const handleStatusChange = useCallback(async (newStatus: PropertyVisitStatus) => {
    if (!selectedModalData) return

    const { markerId, address, position } = selectedModalData; // position is [lat, lng]

    console.log(`Status change initiated for ${address} to: ${newStatus}`);

    // 1. Update local state immediately
    const optimisticUiId = markerId || `temp-${Date.now()}`;

    setSelectedModalData(prevData => prevData ? { ...prevData, currentStatus: newStatus } : null);
    setMarkers(prevMarkers => prevMarkers.map(m =>
      m.id === optimisticUiId ? { ...m, status: newStatus } : m
    ));
    window.dispatchEvent(new CustomEvent('markerStatusUpdate', {
      detail: { markerId: optimisticUiId, status: newStatus }
    }));

    // 2. Persist marker change
    let currentMarkerId = markerId;
    let markerError: string | undefined = undefined;
    try {
      if (markerId && markerId.startsWith('temp-')) {
        console.log("Saving new marker to DB...");
        const response = await fetch("/api/vision-markers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: position[0], // Send lat
            lng: position[1], // Send lng
            address: address,
            status: newStatus,
          }),
        });
        if (!response.ok) throw new Error("Failed to create marker");
        const createdMarker = await response.json();

        if (typeof createdMarker.id !== 'string') {
            throw new Error("Invalid marker ID received from API");
        }
        const realMarkerId = createdMarker.id;
        currentMarkerId = realMarkerId;
        console.log("New marker created with ID:", realMarkerId);

        // Update local state with the real ID
        setMarkers(prevMarkers =>
          prevMarkers.map(m =>
            m.id === markerId
              ? { ...m, id: realMarkerId, status: newStatus }
              : m
          )
        );
        setSelectedModalData(prevData => prevData ? { ...prevData, markerId: realMarkerId, currentStatus: newStatus } : null);

      } else if (markerId) {
        console.log(`Updating existing marker ${markerId} status to ${newStatus}...`);
        const response = await fetch(`/api/vision-markers/${markerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error("Failed to update marker status");
        console.log(`Marker ${markerId} status updated.`);
      } else {
        console.error("Cannot update status, markerId is missing.");
        return;
      }
    } catch (error) {
      console.error("Error saving marker:", error);
      markerError = error instanceof Error ? error.message : "Failed to save marker changes.";
    }

    // 3. Record the visit
    let visitError: string | undefined = undefined;
    if (!markerError && currentMarkerId) {
        try {
            console.log(`Recording visit for marker ${currentMarkerId} with status ${newStatus}...`);
            const visitResponse = await fetch("/api/visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: address,
                    lat: position[0], // Send lat
                    lng: position[1], // Send lng
                    status: newStatus,
                }),
            });
             if (!visitResponse.ok) throw new Error("Failed to record visit");
            console.log("Visit recorded successfully.");
            setKnockCount(prev => (prev !== null ? prev + 1 : 1));
        } catch (error) {
            console.error("Error recording visit:", error);
            visitError = error instanceof Error ? error.message : "Failed to record visit activity.";
        }
    }

    // 4. Show final user feedback
    if (markerError) {
      toast({ title: "Error Saving Status", description: markerError, variant: "destructive" });
    } else {
      toast({
          title: "Status Updated",
          description: visitError
            ? `Status set to ${newStatus}. Error recording visit: ${visitError}`
            : `Status set to ${newStatus} and visit recorded.`
      });
      setIsModalOpen(false);
      setSelectedModalData(null);
    }

  }, [selectedModalData, toast, setIsModalOpen, setSelectedModalData]);

  return (
    <div className="fullscreen-map-container relative">
      {/* Search bar positioned at the top center of the map */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
        {/* AddressSearch now uses Google Places */}
        <AddressSearch onAddressSelect={handleAddressSelect} />
      </div>

      {/* Knock Counter Display */}
      {knockCount !== null && (
          <div className="absolute top-4 right-4 z-10 bg-base-100/80 backdrop-blur-sm shadow-md rounded-lg p-2 flex items-center space-x-2 border border-base-300/50">
              <DoorOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold text-base-content">
                  {knockCount}
              </span>
              <span className="text-xs text-base-content/70">Knocks (12h)</span>
          </div>
      )}

      {/* Replace MapboxMap with GoogleMap */}
      <GoogleMap
        key="google-map-instance" // Changed key just in case
        ref={mapRef}
        markers={markers}
        onMarkerClick={handleMarkerClick}
        onMarkerAdd={handleMarkerAdd}
        searchResult={searchResultRef.current}
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} // Use Google API key
      />

      {isModalOpen && selectedModalData && (
        <SimpleMapCardModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedModalData(null)
          }}
          address={selectedModalData.address}
          streetViewUrl={selectedModalData.streetViewUrl} // URL now uses Google key
          currentStatus={selectedModalData.currentStatus === "New" || selectedModalData.currentStatus === "Search" ? undefined : selectedModalData.currentStatus}
          availableStatuses={[
            "No Answer",
            "Not Interested",
            "Follow up",
            "Inspected",
            "In Contract",
          ]}
          onStatusChange={handleStatusChange}
          leadId={selectedModalData.leadId}
        />
      )}
    </div>
  )
}
