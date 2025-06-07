"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
// Import MapboxMap and its types
import MapboxMap, { MapboxMarkerData, MapboxMapRef } from "@/components/map/mapbox-map"
// Remove GoogleMap import
// import GoogleMap from "@/components/map/google-map" 
import { AddressSearch } from "@/components/map/address-search"
// Remove Google-specific MarkerData import
// import type { MarkerData } from "@/components/map/google-map" 
import { PropertyVisitStatus } from "@/components/map/types"
import { DoorOpen, Home } from 'lucide-react'; // Icon for counter
import { SimpleMapCardModal } from "@/components/map/SimpleMapCardModal"
import { MapProvider } from "@/components/map/map-context" 
import { Button } from "@/components/ui/button"; // Import Button
// Import cn if needed for styling
import Link from "next/link"
// import KnockCounter from "@/components/map/knock-counter"; // Removed import
import { StreetViewImage } from "@/components/map/street-view-image"

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
  streetViewUrl?: string // Add streetViewUrl back
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

  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  // Log when markers state changes
  useEffect(() => {
    console.log("MapPage: Markers state updated", markers);
  }, [markers]);

  // Fetch initial data (markers and knock count)
  useEffect(() => {
    console.log("MapPage: Initial fetch effect running."); // Log initial fetch
    fetchMarkers();
    fetchKnockCount(); // Fetch count on mount
  }, []);

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

  // Function to generate Street View URL
  const getStreetViewUrl = (lat: number, lng: number): string => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API Key is missing!");
      // Return the placeholder if the key is missing
      return "https://placehold.co/600x300/cccccc/969696/png?text=API+Key+Missing";
    }
    const size = "600x300"; // Adjusted size for better modal fit
    const heading = "0";
    const pitch = "0";
    const fov = "90";
    return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`;
  };

  // 1. Create separate state variables if you haven't already
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // handleMarkerClick - receives MapboxMarkerData
  const handleMarkerClick = useCallback((marker: MapboxMarkerData) => {
    console.log("Marker clicked (Mapbox):", marker);
    console.log("Marker address:", marker.properties.address);

    const position = marker.geometry.coordinates as [number, number];
    const [lng, lat] = position; // Destructure coordinates

    const modalData: ModalData = {
      address: marker.properties.address,
      position: position,
      markerId: marker.id,
      currentStatus: marker.properties.status === "New" || marker.properties.status === "Search" ? undefined : marker.properties.status,
      leadId: marker.properties.leadId,
      streetViewUrl: getStreetViewUrl(lat, lng), // Generate Street View URL using lat, lng
    };
    console.log("Setting modal data for existing marker with address:", modalData.address);
    console.log("Street View URL:", modalData.streetViewUrl); // Log the generated URL

    setSelectedModalData(modalData);
    setIsStreetViewOpen(true); // Open street view
  }, []);

  // handleMapClick - now triggered by onMapClick, receives [lng, lat]
  const handleMapClick = useCallback((position: [number, number], address?: string) => {
    console.log("Map clicked at position (Mapbox):", position, "address:", address);
    const [lng, lat] = position; // Destructure coordinates
    
    // Check if a marker already exists with this address
    const existingMarkerWithAddress = markers.find(marker => 
      marker.properties.address === address && address !== undefined && address !== "Unknown Address"
    );
    
    if (existingMarkerWithAddress) {
      console.log("Marker already exists at this address:", address);
      
      // Instead of creating a new marker, simulate clicking the existing one
      const existingPosition = existingMarkerWithAddress.geometry.coordinates as [number, number];
      
      const modalData: ModalData = {
        address: existingMarkerWithAddress.properties.address,
        position: existingPosition,
        markerId: existingMarkerWithAddress.id,
        currentStatus: existingMarkerWithAddress.properties.status === "New" || 
                      existingMarkerWithAddress.properties.status === "Search" 
                      ? undefined 
                      : existingMarkerWithAddress.properties.status,
        leadId: existingMarkerWithAddress.properties.leadId,
        streetViewUrl: getStreetViewUrl(lat, lng),
      };
      
      // Fly to the marker
      if (mapRef.current) {
        mapRef.current.flyTo(existingPosition, 15);
      }
      
      console.log("Opening existing marker at address:", modalData.address);
      setSelectedModalData(modalData);
      setIsStreetViewOpen(true);
      return;
    }

    // Create a new marker if one doesn't already exist at this address
    const tempId = `temp-${Date.now()}`;
    console.log("Generated temporary ID:", tempId);

    const newMarker: MapboxMarkerData = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: position },
      properties: {
        address: address || "Unknown Address",
        status: "New",
        leadId: tempId,
      },
      id: tempId,
    };

    console.log("Created new marker with address:", newMarker.properties.address);
    setMarkers((prevMarkers) => [...prevMarkers, newMarker]);

    const modalData: ModalData = {
      address: newMarker.properties.address,
      position: position,
      markerId: tempId,
      currentStatus: undefined,
      leadId: tempId,
      streetViewUrl: getStreetViewUrl(lat, lng), // Generate Street View URL using lat, lng
    };
    console.log("Setting modal data with address:", modalData.address);
    console.log("Street View URL:", modalData.streetViewUrl); // Log the generated URL

    setSelectedModalData(modalData);
    setIsStreetViewOpen(true);
  }, [markers, mapRef, getStreetViewUrl]);

  const handleAddressSelect = useCallback((result: { place_name: string; center: { lat: number; lng: number } }) => {
    console.log("Address selected (Mapbox Geocoder):", result);
    const { lat, lng } = result.center;
    // Fly map to the selected location
    if (mapRef.current) {
      mapRef.current.flyTo([lng, lat], 15); // Zoom level 15
    }
    // Create a temporary marker for the search result
    handleMapClick([lng, lat], result.place_name);
  }, [handleMapClick]); // Add handleMapClick to dependencies

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
        console.log("Saving new marker to DB with payload:", JSON.stringify({ // Log payload
            lat: latitude,
            lng: longitude,
            address: address || "Unknown Address",
            status: newStatus,
          }));
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
        if (!response.ok) {
            const errorBody = await response.text(); // Read error body
            console.error(`Failed to create marker: ${response.status} ${response.statusText}`, errorBody); // Log status and body
            throw new Error(`Failed to create marker: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        const createdMarker = await response.json();

        if (typeof createdMarker.id !== 'string') {
            console.error("Invalid marker data received from API:", createdMarker); // Log invalid data
            throw new Error("Invalid marker ID received from API");
        }
        const realMarkerId = createdMarker.id;
        currentMarkerId = realMarkerId;
        console.log("New marker created with ID:", realMarkerId);

        // Update local state with the real ID and status (in GeoJSON structure)
        setMarkers(prevMarkers =>
          prevMarkers.map(m =>
            m.id === markerId // markerId is the temp ID
              ? { ...m, id: realMarkerId, properties: { ...m.properties, status: newStatus } } // Create new object with real ID
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
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to update marker: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(`Failed to update marker status: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        console.log(`Marker ${markerId} status updated.`);
      } else {
        console.error("Cannot update status, markerId is missing.");
        markerError = "Cannot update status, marker information is missing."; // Set user-facing error
        // return; // Maybe don't exit here, let the toast show the error
      }
    } catch (error) {
      console.error("Error saving marker during API call:", error); // Log the caught error object
      markerError = error instanceof Error ? error.message : "Failed to save marker changes.";
      // Revert optimistic UI update on marker save error (in GeoJSON structure)
      // Important: Ensure selectedModalData still exists for reverting
      if(selectedModalData) { 
        setMarkers(prevMarkers => prevMarkers.map(m =>
          m.id === optimisticUiId ? { ...m, properties: { ...m.properties, status: selectedModalData.currentStatus || 'New' } } : m
        ));
      }
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
             if (!visitResponse.ok) {
                 const errorBody = await visitResponse.text();
                 console.error(`Failed to record visit: ${visitResponse.status} ${visitResponse.statusText}`, errorBody);
                 throw new Error("Failed to record visit"); // Keep error concise for toast
             }
            console.log("Visit recorded successfully.");
            // Fetch knock count again after successful visit recording
            fetchKnockCount();
        } catch (error) {
            console.error("Error recording visit:", error); // Log the caught error object
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

    // Close street view after successful status change
    setIsStreetViewOpen(false);
  }, [selectedModalData, toast, fetchKnockCount]);

  // Function to handle zoom changes
  const handleZoomChange = useCallback((zoomLevel: number) => {
    mapRef.current?.getMapInstance()?.zoomTo(zoomLevel, { duration: 500 });
  }, []); // No dependencies needed as mapRef is stable

  console.log("MapPage: Passing markers to MapboxMap:", markers); // Log markers prop

  // THIS IS AN INFERRED LOCATION FOR THE MODAL RENDERING
  // Ensure this console.log is placed immediately before <SimpleMapCardModal /> is rendered
  if (isStreetViewOpen && selectedModalData) {
    console.log("[MapPage] Rendering SimpleMapCardModal. selectedModalData:", JSON.stringify(selectedModalData));
    console.log("[MapPage] selectedModalData.leadId being passed:", selectedModalData.leadId);
  }

  useEffect(() => {
    console.log("StreetViewImage mounted");
    return () => console.log("StreetViewImage unmounted");
  }, []);

  return (
    <MapProvider>
      <div className="relative h-screen w-screen overflow-hidden">
        
        {/* AddressSearch with Home Button */}
        <div className="absolute top-4 left-4-translate-x-1/2 z-20 w-full max-w-md px-4 flex gap-[75px] items-center">
          <Link href="/" className="shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-10 sm:h-12 w-10 sm:w-12 rounded-full bg-black/50 backdrop-blur-sm border-[#59ff00] hover:bg-[#59ff00]/10 hover:border-[#59ff00]/80"
            >
              <Home className="h-5 w-5 text-white/50" />
            </Button>
          </Link>
          <AddressSearch 
            onAddressSelect={handleAddressSelect}
          />
        </div>

        {/* Knock Counter Display - top left */}
        {knockCount !== null && (
          <div className="absolute top-[200px] left-4 z-10 bg-green-800/40 backdrop-blur-sm shadow-md rounded-lg p-2 flex items-center space-x-2 border border-lime-400/90">
            <DoorOpen className="h-8 w-8 text-white" />
            <span className="font-semibold text-base-content">
              {knockCount}
            </span>
            <span className="text-xs text-base-content/70"></span>
          </div>
        )}

        {/* Zoom Control Buttons - Top Left Below Counter */}
        <div className="absolute top-[80px] left-4 z-10 flex flex-col gap-2">
          <Button 
            className="btn text-xs h-8 w-16" // Added .btn for glass, adjusted size/text
            onClick={() => handleZoomChange(20)} 
            variant="secondary"
            size="sm"
          >
            Close
          </Button>
          <Button 
            className="btn text-xs h-8 w-16" // Added .btn for glass, adjusted size/text
            onClick={() => handleZoomChange(15)} 
            variant="secondary"
            size="sm"
          >
            Medium
          </Button>
          <Button 
            className="btn text-xs h-8 w-16" // Added .btn for glass, adjusted size/text
            onClick={() => handleZoomChange(10)} 
            variant="secondary"
            size="sm"
          >
            Far
          </Button>
        </div>

        {/* Map Container with fixed styling */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <MapboxMap
            key="mapbox-map-instance" 
            ref={mapRef}
            accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
            markersData={markers} 
            onMarkerClick={handleMarkerClick}
            onMapClick={handleMapClick} 
            showUserLocation={true}
          />
        </div>

        {/* Street View Card */}
        {isStreetViewOpen && selectedModalData && (
          <SimpleMapCardModal
            isOpen={isStreetViewOpen}
            onClose={() => {
              setIsStreetViewOpen(false);
              setSelectedModalData(null);
            }}
            address={selectedModalData.address || ""}
            position={selectedModalData.position}
            streetViewUrl={selectedModalData.streetViewUrl}
            status={selectedModalData.currentStatus}
            onStatusChange={handleStatusChange}
            initialLeadId={selectedModalData.leadId}
          />
        )}
        
        {/* Contact Modal */}
        {isContactModalOpen && selectedModalData && (
          <SimpleMapCardModal
            isOpen={isContactModalOpen}
            onClose={() => {
              setIsContactModalOpen(false);
            }}
            address={selectedModalData.address || "Loading address..."}
            initialLeadId={selectedModalData.leadId}
          />
        )}
      </div>
    </MapProvider>
  )
}
