"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import MapboxMap from "@/components/map/mapbox-map"
import { AddressSearch } from "@/components/map/address-search"
import { MapInteractionDrawer, PropertyVisitStatus } from "@/components/map/MapInteractionDrawer"
import type { MarkerData } from "@/components/map/mapbox-map"
import { DoorOpen } from 'lucide-react'; // Icon for counter
import { SimpleMapDrawer } from "@/components/map/SimpleMapDrawer"
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

// Define a type for the data needed by the drawer
interface DrawerData {
  address: string
  position: [number, number]
  markerId?: string
  currentStatus?: PropertyVisitStatus | "New" | "Search"
  streetViewUrl?: string
  leadId?: string
}

export default function MapPage() {
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedDrawerData, setSelectedDrawerData] = useState<DrawerData | null>(null)
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [knockCount, setKnockCount] = useState<number | null>(null)
  const mapRef = useRef<any>(null)
  const { toast } = useToast()
  // const { data: session } = useSession(); // Example if using next-auth client hook

  // Use a stable ref for search results to avoid re-renders
  const searchResultRef = useRef<{
    position: [number, number]
    address: string
  } | null>(null)

  // Fetch initial data (markers and knock count)
  useEffect(() => {
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
              position: [m.latitude, m.longitude],
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

  // Use useCallback to ensure these functions don't change on re-renders
  const handleMarkerClick = useCallback((marker: MarkerData) => {
    console.log("Marker clicked:", marker)
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${marker.position[0]},${marker.position[1]}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&return_error_codes=true` // Use env variable

    setSelectedDrawerData({
      address: marker.address,
      position: marker.position,
      markerId: marker.id,
      currentStatus: marker.status, // marker.status is now correctly typed
      streetViewUrl: streetViewUrl, // Add fetched/constructed URL
      leadId: marker.leadId // Include the leadId from the marker data
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
      leadId: tempId, // Use the temporary ID as leadId
    }

    setMarkers((prevMarkers) => [...prevMarkers, newMarker])

    // Set up the drawer with the new marker details
    // TODO: Implement logic to get Street View URL
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${position[0]},${position[1]}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&return_error_codes=true` // Use env variable

    setSelectedDrawerData({
      address: address,
      position: position,
      markerId: tempId, // Use the temporary ID
      currentStatus: undefined, // No status selected yet for a new location
      streetViewUrl: streetViewUrl,
      leadId: tempId, // Use the temporary ID as leadId
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
        leadId: searchMarkerId, // Use the temporary ID as leadId
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

  // Update status, persist marker, and record visit
  const handleStatusChange = useCallback(async (newStatus: PropertyVisitStatus) => {
    if (!selectedDrawerData) return

    const { markerId, address, position } = selectedDrawerData;

    console.log(`Status change initiated for ${address} to: ${newStatus}`);

    // 1. Update local state immediately for UI feedback
    const optimisticUiId = markerId || `temp-${Date.now()}`; 
    
    setSelectedDrawerData(prevData => prevData ? { ...prevData, currentStatus: newStatus } : null);
    setMarkers(prevMarkers => prevMarkers.map(m => 
      m.id === optimisticUiId ? { ...m, status: newStatus } : m
    ));
    window.dispatchEvent(new CustomEvent('markerStatusUpdate', { 
      detail: { markerId: optimisticUiId, status: newStatus }
    }));

    // 2. Persist marker change (Create or Update)
    let currentMarkerId = markerId; 
    let markerError: string | undefined = undefined; 
    try {
      if (markerId && markerId.startsWith('temp-')) {
        console.log("Saving new marker to DB...");
        console.log("Sending status value:", newStatus); // Debug the exact status value being sent
        const response = await fetch("/api/vision-markers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: position[0],
            lng: position[1],
            address: address,
            status: newStatus, // This should be the string like "No Answer" 
          }),
        });
        if (!response.ok) throw new Error("Failed to create marker");
        const createdMarker = await response.json();
        
        if (typeof createdMarker.id !== 'string') {
            throw new Error("Invalid marker ID received from API");
        }
        const realMarkerId = createdMarker.id; // Assign to new variable after check
        currentMarkerId = realMarkerId; // Update the ID for visit recording
        console.log("New marker created with ID:", realMarkerId);

        // Update local state with the real ID
        setMarkers(prevMarkers => 
          prevMarkers.map(m => 
            m.id === markerId // Find the marker with the old temp ID
              ? { ...m, id: realMarkerId, status: newStatus } // Use the guaranteed string ID
              : m 
          )
        );
        setSelectedDrawerData(prevData => prevData ? { ...prevData, markerId: realMarkerId, currentStatus: newStatus } : null);

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

    // 3. Record the visit (only if marker was saved successfully)
    let visitError: string | undefined = undefined; 
    if (!markerError && currentMarkerId) { 
        try {
            console.log(`Recording visit for marker ${currentMarkerId} with status ${newStatus}...`);
            const visitResponse = await fetch("/api/visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: address,
                    lat: position[0],
                    lng: position[1],
                    status: newStatus,
                }),
            });
             if (!visitResponse.ok) throw new Error("Failed to record visit");
            console.log("Visit recorded successfully.");
            // ---> Increment local count on successful visit recording <--- 
            setKnockCount(prev => (prev !== null ? prev + 1 : 1)); 
        } catch (error) {
            console.error("Error recording visit:", error);
            visitError = error instanceof Error ? error.message : "Failed to record visit activity.";
        }
    }

    // 4. Show final user feedback and close drawer on success
    if (markerError) { // Only check markerError for deciding if the main action failed
      toast({ 
        title: "Error Saving Status", 
        description: markerError, 
        variant: "destructive" 
      });
      // Don't close drawer if marker saving failed
    } else {
      // Show success toast (even if visit recording had a minor error)
      toast({ 
          title: "Status Updated", 
          description: visitError 
            ? `Status set to ${newStatus}. Error recording visit: ${visitError}` 
            : `Status set to ${newStatus} and visit recorded.` 
      });
      // Close the drawer after successful marker save
      setIsDrawerOpen(false); 
      setSelectedDrawerData(null); // Clear selected data as well
      setIsDrawerExpanded(false); // Ensure it's not expanded next time
    }

  }, [selectedDrawerData, toast, setIsDrawerOpen, setSelectedDrawerData, setIsDrawerExpanded]); // Add state setters to dependency array

  return (
    <div className="fullscreen-map-container relative">
      {/* Search bar positioned at the top center of the map */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
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
        <SimpleMapDrawer
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedDrawerData(null)
            setIsDrawerExpanded(false) // Ensure it collapses on close
          }}
          // Pass individual props from selectedDrawerData
          address={selectedDrawerData.address}
          streetViewUrl={selectedDrawerData.streetViewUrl}
          // Pass undefined if status is 'New' or 'Search', otherwise pass the status
          currentStatus={selectedDrawerData.currentStatus === "New" || selectedDrawerData.currentStatus === "Search" ? undefined : selectedDrawerData.currentStatus}
          // Pass the CORRECT available statuses
          availableStatuses={[
            "No Answer",
            "Not Interested",
            "Follow up",
            "Inspected",
            "In Contract",
          ]}
          onStatusChange={handleStatusChange}
          // Expansion control props
          isExpanded={isDrawerExpanded}
          onExpand={() => setIsDrawerExpanded(true)}
          onCollapse={() => setIsDrawerExpanded(false)} // Pass the collapse handler
          leadId={selectedDrawerData.leadId}
        />
      )}
    </div>
  )
}
