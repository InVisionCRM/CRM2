"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
// Import MapboxMap and its types
import MapboxMap, { MapboxMarkerData, MapboxMapRef } from "@/components/map/mapbox-map"
// Remove GoogleMap import
// import GoogleMap from "@/components/map/google-map" 
// Remove AddressSearch import (for now)
// import { AddressSearch } from "@/components/map/address-search"
// Remove Google-specific MarkerData import
// import type { MarkerData } from "@/components/map/google-map" 
import { PropertyVisitStatus } from "@/components/map/types"
import { DoorOpen } from 'lucide-react'; // Icon for counter
import { SimpleMapCardModal } from "@/components/map/SimpleMapCardModal"
import { MapProvider } from "@/components/map/map-context" 

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

// Define a type for the data needed by the modal (using Mapbox position format)
interface ModalData {
  address?: string // Address might be optional initially
  position: [number, number] // [lng, lat]
  markerId?: string
  currentStatus?: PropertyVisitStatus | "New" | "Search"
  leadId?: string
  // Removed streetViewUrl as it was Google-specific
}

export default function MapPage() {
  console.log("--- Rendering MapPage ---"); // Log page render

  // Use MapboxMarkerData for state
  const [markers, setMarkers] = useState<MapboxMarkerData[]>([]) 
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedModalData, setSelectedModalData] = useState<ModalData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [knockCount, setKnockCount] = useState<number | null>(null)
  // Use MapboxMapRef type for the ref
  const mapRef = useRef<MapboxMapRef>(null) 
  const { toast } = useToast()

  // Log when markers state changes
  useEffect(() => {
    console.log("MapPage: Markers state updated", markers);
  }, [markers]);

  // Fetch initial data (markers and knock count)
  /* <<< COMMENT OUT START
  useEffect(() => {
    console.log("MapPage: Initial fetch effect running."); // Log initial fetch
    fetchMarkers();
    fetchKnockCount(); // Fetch count on mount
  }, []);
  COMMENT OUT END >>> */

  // Function to fetch markers from the API
  const fetchMarkers = async () => {
    console.log("MapPage: fetchMarkers called"); // Log fetch call
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
        // Map API response to MapboxMarkerData format (GeoJSON Feature)
        const formattedMarkers: MapboxMarkerData[] = data.markers.map((m: any) => {
          const validatedStatus = isValidStatus(m.status) ? m.status : "New";
          // Ensure coordinates are valid numbers
          const longitude = typeof m.longitude === 'number' ? m.longitude : null;
          const latitude = typeof m.latitude === 'number' ? m.latitude : null;

          if (longitude === null || latitude === null) {
              console.warn(`Invalid coordinates for marker ${m.id}:`, m.longitude, m.latitude);
              return null; // Skip this marker
          }

          return {
              type: 'Feature', // Add GeoJSON type
              geometry: {
                  type: 'Point',
                  coordinates: [longitude, latitude] // [lng, lat]
              },
              properties: { // Move other data into properties
                  address: m.address,
                  status: validatedStatus,
                  leadId: m.leadId,
                  // visits: m.visits || [], // Include if needed by MapboxMarkerData properties
              },
              id: m.id, // Keep id at the top level
          }
        }).filter((m: MapboxMarkerData | null): m is MapboxMarkerData => m !== null); // Filter out nulls from invalid coordinates

        console.log("Formatted markers for Mapbox (GeoJSON):", formattedMarkers)
        console.log("MapPage: fetchMarkers finished, setting markers"); // Log before setting state
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
    console.log("MapPage: fetchKnockCount called"); // Log fetch call
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

  // handleMarkerClick - receives MapboxMarkerData
  const handleMarkerClick = useCallback((marker: MapboxMarkerData) => {
    console.log("Marker clicked (Mapbox):", marker)

    // Cast coordinates to [number, number] for ModalData
    const position = marker.geometry.coordinates as [number, number];

    setSelectedModalData({
      address: marker.properties.address,
      position: position, // Use the casted position
      markerId: marker.id,
      currentStatus: marker.properties.status === "New" || marker.properties.status === "Search" ? undefined : marker.properties.status,
      leadId: marker.properties.leadId
    })
    setIsModalOpen(true)
  }, []) // Empty dependency array: assumes it doesn't depend on other state/props

  // handleMarkerAdd - now triggered by onMapClick, receives [lng, lat]
  const handleMapClick = useCallback((position: [number, number], address?: string) => {
    console.log("Map clicked at position (Mapbox):", position, "address:", address);

    const tempId = `temp-${Date.now()}`;
    // Create marker in GeoJSON format
    const newMarker: MapboxMarkerData = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: position // [lng, lat]
      },
      properties: {
        address: address || "Unknown Address", // Use placeholder if address not yet geocoded
        status: "New",
        leadId: tempId, // Link temporary marker to potential lead creation
      },
      id: tempId,
    };


    setMarkers((prevMarkers) => [...prevMarkers, newMarker]);

    // Prepare data for the modal (still uses simple position for now)
    setSelectedModalData({
      address: newMarker.properties.address,
      position: position, // Keep [lng, lat] for modal state
      markerId: tempId,
      currentStatus: undefined, // New marker starts with no set status in modal
      leadId: tempId,
    });
    setIsModalOpen(true);
  }, []); // Empty dependency array

  // handleAddressSelect - Commented out as AddressSearch is removed
  // const handleAddressSelect = useCallback((result: { /* Mapbox geocoding result type */ }) => {
  //   console.log("Address selected (Mapbox - TODO):", result)
  //   // TODO: Implement using Mapbox Geocoding API
  //   // 1. Get coordinates [lng, lat] from result
  //   // 2. Create temporary search marker (MapboxMarkerData)
  //   // 3. Update markers state
  //   // 4. Call mapRef.current.flyTo(position)
  // }, [])

  // handleStatusChange - uses [lng, lat] but sends lat/lng separately to API
  const handleStatusChange = useCallback(async (newStatus: PropertyVisitStatus) => {
    if (!selectedModalData) return

    // Destructure position as [lng, lat]
    const { markerId, address, position } = selectedModalData;
    const [longitude, latitude] = position; // Extract lng and lat

    console.log(`Status change initiated for ${address} to: ${newStatus}`);

    // 1. Update local state immediately (using GeoJSON format)
    const optimisticUiId = markerId || `temp-${Date.now()}`;

    setSelectedModalData(prevData => prevData ? { ...prevData, currentStatus: newStatus } : null);
    // Update the properties within the GeoJSON structure
    setMarkers(prevMarkers => prevMarkers.map(m =>
        m.id === optimisticUiId ? { ...m, properties: { ...m.properties, status: newStatus } } : m
    ));

    // Optional: Dispatch custom event if needed elsewhere
    // window.dispatchEvent(new CustomEvent('markerStatusUpdate', {
    //   detail: { markerId: optimisticUiId, status: newStatus }
    // }));

    // 2. Persist marker change (API expects lat, lng)
    let currentMarkerId = markerId;
    let markerError: string | undefined = undefined;
    try {
      if (markerId && markerId.startsWith('temp-')) {
        console.log("Saving new marker to DB...");
        const response = await fetch("/api/vision-markers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: latitude, // Send latitude
            lng: longitude, // Send longitude
            address: address || "Unknown Address",
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

        // Update local state with the real ID and status (in GeoJSON structure)
        setMarkers(prevMarkers =>
          prevMarkers.map(m =>
            m.id === markerId
              ? { ...m, id: realMarkerId, properties: { ...m.properties, status: newStatus } }
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
        // Optional: Show error toast if needed
        return; // Exit if no markerId
      }
    } catch (error) {
      console.error("Error saving marker:", error);
      markerError = error instanceof Error ? error.message : "Failed to save marker changes.";
      // Revert optimistic UI update on marker save error (in GeoJSON structure)
      setMarkers(prevMarkers => prevMarkers.map(m =>
        m.id === optimisticUiId ? { ...m, properties: { ...m.properties, status: selectedModalData.currentStatus || 'New' } } : m
      ));
    }

    // 3. Record the visit (API expects lat, lng)
    let visitError: string | undefined = undefined;
    if (!markerError && currentMarkerId) {
        try {
            console.log(`Recording visit for marker ${currentMarkerId} with status ${newStatus}...`);
            const visitResponse = await fetch("/api/visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: address || "Unknown Address",
                    lat: latitude, // Send latitude
                    lng: longitude, // Send longitude
                    status: newStatus,
                }),
            });
             if (!visitResponse.ok) throw new Error("Failed to record visit");
            console.log("Visit recorded successfully.");
            // Fetch knock count again after successful visit recording
            fetchKnockCount(); 
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
    }
    // Close modal regardless of visit recording success/failure if marker was saved
    setIsModalOpen(false);
    setSelectedModalData(null);

  }, [selectedModalData, toast, setIsModalOpen, setSelectedModalData, fetchKnockCount]);

  console.log("MapPage: Passing markers to MapboxMap:", markers); // Log markers prop

  return (
    <MapProvider> 
      <div className="fullscreen-map-container relative" style={{ height: "100vh", width: "100%" }}>
        {/* Search bar - Commented out for now */}
        {/* <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4"> */}
          {/* TODO: Replace with Mapbox Geocoder component */}
          {/* <AddressSearch onAddressSelect={handleAddressSelect} /> */}
        {/* </div> */}

        {/* Knock Counter Display (remains the same) */}
        {knockCount !== null && (
          <div className="absolute top-4 right-4 z-10 bg-base-100/80 backdrop-blur-sm shadow-md rounded-lg p-2 flex items-center space-x-2 border border-base-300/50">
            <DoorOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-base-content">
              {knockCount}
            </span>
            <span className="text-xs text-base-content/70">Knocks (12h)</span>
          </div>
        )}

        {/* Render MapboxMap */}
        <MapboxMap
          key="mapbox-map-instance" 
          ref={mapRef}
          // Ensure accessToken is passed (replace with your actual token source)
          accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
          markersData={markers} // Use correct prop name
          onMarkerClick={handleMarkerClick}
          onMapClick={handleMapClick} // Pass the correct handler
          // Pass other props as needed, e.g., initialCenter, initialZoom
        />

        {isModalOpen && selectedModalData && (
          <SimpleMapCardModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedModalData(null)
            }}
            address={selectedModalData.address || "Loading address..."}
            // Removed streetViewUrl 
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
    </MapProvider>
  )
}
