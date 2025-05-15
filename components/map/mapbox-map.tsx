"use client"

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react"
import mapboxgl, { LngLatLike, Map, Marker } from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useMapContext } from "./map-context"
import { getMarkerColor } from "@/lib/utils"
import { PropertyVisitStatus } from "./types" // Assuming types are defined here

// Define the Marker data structure expected by this component
export interface MapboxMarkerData {
    type: 'Feature';
    id: string; // Unique identifier for the marker
    geometry: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
        address: string;
        status: PropertyVisitStatus | "New" | "Search";
        leadId?: string;
        visits?: any[]; // Define more specific type if possible
    };
    
}

// Define the props for the MapboxMap component
interface MapboxMapProps {
    markersData: MapboxMarkerData[];
    onMarkerClick: (markerData: MapboxMarkerData) => void;
    onMapClick?: (coordinates: [number, number], address?: string) => void; // Optional map click handler
    initialCenter?: [number, number];
    initialZoom?: number;
    accessToken: string;
    mapStyle?: string;
    searchResultMarker?: MapboxMarkerData | null; // Optional marker for search results
    showUserLocation?: boolean; // Prop to control showing user location
}

// Define the functions exposed via the ref
export interface MapboxMapRef {
    getMapInstance: () => Map | null;
    flyTo: (center: LngLatLike, zoom?: number) => void;
    fitBounds: (bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => void;
    addMarker: (markerData: MapboxMarkerData) => void;
    removeMarker: (markerId: string) => void;
    updateMarker: (markerData: MapboxMarkerData) => void;
    // Add other useful methods as needed
}

const MapboxMap = forwardRef<MapboxMapRef, MapboxMapProps>((
    {
        markersData,
        onMarkerClick,
        onMapClick,
        initialCenter = [-83.333, 42.266], // Default center (USA)
        initialZoom = 10,
        accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
        mapStyle = "mapbox://styles/invisionpjm/cm966bqbg00br01qugzbw7vef",
        searchResultMarker,
        showUserLocation = true, // Default to showing user location
    },
    ref
) => {
    console.log("[MapboxMap] Received props:", { initialCenter, initialZoom, mapStyle });

    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const markersRef = useRef<{ [key: string]: Marker }>({});
    const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const { setIsLoading, setError, setLocation } = useMapContext();

    mapboxgl.accessToken = accessToken;

    // --- Map Initialization Effect ---
    useEffect(() => {
        if (mapRef.current || !mapContainer.current) return; // Initialize map only once

        setIsLoading(true);
        setError(null);

        try {
            const map = new Map({
                container: mapContainer.current,
                style: mapStyle,
                center: initialCenter,
                zoom: initialZoom,
                attributionControl: false, // Optional: Hide default attribution
            });

            // Debug logging for map initialization
            console.log("[MapboxMap] Map initializing with:", {
                accessToken: accessToken ? "Token provided (hidden)" : "NO TOKEN!",
                style: mapStyle,
                center: initialCenter,
                zoom: initialZoom,
            });

            mapRef.current = map;

            const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
                if (!onMapClick) return;
                
                const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
                console.log("[MapboxMap] Map clicked at coords:", coords);

                let fetchedAddress: string | undefined = undefined;
                if (accessToken) {
                    try {
                        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${accessToken}&types=address&limit=1`;
                        const response = await fetch(geocodeUrl);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.features?.length > 0) {
                                fetchedAddress = data.features[0].place_name;
                            }
                        }
                    } catch (error) {
                        console.error("[MapboxMap] Reverse geocoding error:", error);
                    }
                }
                
                onMapClick(coords, fetchedAddress);
            };

            map.on("load", () => {
                console.log("[MapboxMap] Map Loaded");
                setMapLoaded(true);
                setIsLoading(false);

                // Add standard controls
                map.addControl(new mapboxgl.NavigationControl(), "top-right");
                map.addControl(new mapboxgl.ScaleControl());
                map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

                // Geolocation Control (conditionally added)
                if (showUserLocation) {
                    const geolocate = new mapboxgl.GeolocateControl({
                        positionOptions: {
                            enableHighAccuracy: true,
                        },
                        trackUserLocation: true,
                        showUserHeading: true,
                    });
                    geolocateControlRef.current = geolocate;
                    map.addControl(geolocate, "top-right");

                    geolocate.on('geolocate', (e) => {
                        // Cast event to expected shape with coords
                        const geolocateEvent = e as { coords: { latitude: number; longitude: number; } };
                        if (geolocateEvent.coords) {
                            const { longitude, latitude } = geolocateEvent.coords;
                            console.log(`[MapboxMap] User location: ${latitude}, ${longitude}`);
                            // Update context or state if needed
                            setLocation({ lat: latitude, lng: longitude });
                        }
                    });
                    geolocate.on('error', (e) => {
                        console.error('[MapboxMap] Geolocation error:', e.message);
                        setError('Geolocation failed. Please ensure location services are enabled and permissions granted.');
                        // Optionally remove the control if it errors persistently
                        if (geolocateControlRef.current && mapRef.current) {
                            // mapRef.current.removeControl(geolocateControlRef.current);
                        }
                    });
                }

                // Add map click handler after load
                map.on("click", handleMapClick);
            });

            map.on("error", (e) => {
                console.error("[MapboxMap] MapLibre GL Error:", e.error?.message || e);
                setError(`Map error: ${e.error?.message || 'Unknown error'}`);
                setIsLoading(false);
            });

            // Cleanup function
            return () => {
                map.off("click", handleMapClick); // Remove click handler
                console.log("[MapboxMap] Cleaning up map instance...");
                mapRef.current?.remove();
                mapRef.current = null;
                setMapLoaded(false);
                markersRef.current = {}; // Clear marker references
            };
        } catch (error) {
            console.error("[MapboxMap] Failed to initialize map:", error);
            setError("Failed to initialize the map. Please check your Mapbox access token and network connection.");
            setIsLoading(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, mapStyle, initialCenter.toString(), initialZoom, showUserLocation]); // Remove onMapClick from dependencies


    // --- Marker Management Effect ---
    const syncMarkers = useCallback(() => {
        if (!mapRef.current || !mapLoaded) return;
        console.log('[MapboxMap] Syncing markers...', { count: markersData.length });
        
        try {
            const map = mapRef.current;
            const currentMarkerIds = Object.keys(markersRef.current);
            const newMarkerIds = new Set(markersData.map(m => m.id));
            
            // Check for invalid marker data
            markersData.forEach((marker, index) => {
                // Validate required properties
                if (!marker.type || marker.type !== 'Feature') {
                    console.error(`[MapboxMap] Invalid marker at index ${index}: missing or incorrect 'type' property`, marker);
                }
                if (!marker.geometry || !marker.geometry.type || marker.geometry.type !== 'Point') {
                    console.error(`[MapboxMap] Invalid marker at index ${index}: missing or incorrect geometry type`, marker);
                }
                if (!marker.geometry?.coordinates || !Array.isArray(marker.geometry.coordinates) || marker.geometry.coordinates.length !== 2) {
                    console.error(`[MapboxMap] Invalid marker at index ${index}: invalid coordinates`, marker);
                }
                if (!marker.properties) {
                    console.error(`[MapboxMap] Invalid marker at index ${index}: missing properties`, marker);
                }
            });

            // 1. Remove markers that are no longer in markersData
            currentMarkerIds.forEach(id => {
                if (!newMarkerIds.has(id)) {
                    console.log(`[MapboxMap] Removing marker: ${id}`);
                    markersRef.current[id]?.remove();
                    delete markersRef.current[id];
                }
            });

            // 2. Add new markers or update existing ones
            markersData.forEach(markerData => {
                const { id, geometry, properties } = markerData;
                
                if (!geometry?.coordinates || geometry.coordinates.length !== 2) {
                    return;
                }
                
                const position = geometry.coordinates as [number, number];
                const color = getMarkerColor(properties.status);

                if (markersRef.current[id]) {
                    // Marker exists, update if needed
                    const existingMarker = markersRef.current[id];
                    const existingLngLat = existingMarker.getLngLat();
                    const markerElement = existingMarker.getElement();
                    
                    if (existingLngLat.lng !== position[0] || existingLngLat.lat !== position[1]) {
                        existingMarker.setLngLat(position);
                    }
                    // Update color by changing the background of the div
                    if (markerElement.style.backgroundColor !== color) {
                        markerElement.style.backgroundColor = color;
                    }
                    // Update popup
                    existingMarker.getPopup()?.setHTML(`
                        <div>
                            <strong>${properties.address || 'Address N/A'}</strong><br>
                            Status: ${properties.status}<br>
                            ID: ${id}
                        </div>
                    `);
                } else {
                    // Marker doesn't exist, create and add it as a simple circle
                    const markerElement = document.createElement('div');
                    markerElement.style.width = '12px'; // Circle diameter
                    markerElement.style.height = '12px';
                    markerElement.style.backgroundColor = color;
                    markerElement.style.borderRadius = '50%';
                    markerElement.style.border = '2px solid white'; // White border for visibility
                    markerElement.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)'; // Optional shadow
                    markerElement.style.cursor = 'pointer';

                    const marker = new Marker({ element: markerElement })
                        .setLngLat(position)
                        .setPopup(new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(`
                            <div>
                                <strong>${properties.address || 'Address N/A'}</strong><br>
                                Status: ${properties.status}<br>
                                ID: ${id}
                            </div>
                        `))
                        .addTo(map);

                    marker.getElement().addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onMarkerClick(markerData);
                        mapRef.current?.flyTo({ center: position, zoom: Math.max(mapRef.current.getZoom(), 15) });
                    });
                    markersRef.current[id] = marker;
                }
            });

             console.log(`[MapboxMap] Marker sync complete. Current markers: ${Object.keys(markersRef.current).length}`);
        } catch (error) {
            console.error('[MapboxMap] Error during marker sync:', error);
            setError('An error occurred while syncing markers. Please try again later.');
        }
    }, [mapLoaded, markersData, onMarkerClick]); // Dependencies for marker sync

    useEffect(() => {
        syncMarkers();
    }, [syncMarkers]);

    // --- Search Result Marker Effect ---
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return;

        // Remove previous search marker if it exists
        const existingSearchMarker = markersRef.current["search-result"];
        if (existingSearchMarker) {
            existingSearchMarker.remove();
            delete markersRef.current["search-result"];
        }

        if (searchResultMarker) {
            console.log("[MapboxMap] Adding search result marker");
            const position = searchResultMarker.geometry.coordinates as [number, number];
            const searchMarker = new Marker({ color: '#FFA500' }) // Orange color for search result
                .setLngLat(position)
                .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(searchResultMarker.properties.address || 'Search Result'))
                .addTo(mapRef.current);

            markersRef.current["search-result"] = searchMarker;

            // Optionally fly to the search result
            mapRef.current.flyTo({ center: position, zoom: 15 });
        }
    }, [searchResultMarker, mapLoaded]);

    // --- Expose Imperative Methods --- Access map functions from parent
    useImperativeHandle(ref, () => ({
        getMapInstance: () => mapRef.current,
        flyTo: (center, zoom) => {
            mapRef.current?.flyTo({ center, zoom });
        },
        fitBounds: (bounds, options) => {
            mapRef.current?.fitBounds(bounds, options);
        },
        addMarker: (markerData) => {
            if (!mapRef.current || !mapLoaded || markersRef.current[markerData.id]) return;

            const position = markerData.geometry.coordinates as [number, number];
            const color = getMarkerColor(markerData.properties.status);
            
            const markerElement = document.createElement('div');
            markerElement.style.width = '12px';
            markerElement.style.height = '12px';
            markerElement.style.backgroundColor = color;
            markerElement.style.borderRadius = '50%';
            markerElement.style.border = '2px solid white';
            markerElement.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
            markerElement.style.cursor = 'pointer';

            const marker = new Marker({ element: markerElement })
                .setLngLat(position)
                .setPopup(new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(`
                    <div>
                        <strong>${markerData.properties.address || 'Address N/A'}</strong><br>
                        Status: ${markerData.properties.status}<br>
                        ID: ${markerData.id}
                    </div>
                `))
                .addTo(mapRef.current);

            marker.getElement().addEventListener('click', (e) => {
                e.stopPropagation();
                onMarkerClick(markerData);
            });
            markersRef.current[markerData.id] = marker;
        },
        removeMarker: (markerId) => {
            if (!mapRef.current || !mapLoaded || !markersRef.current[markerId]) return;
            console.log(`[MapboxMap] Imperatively removing marker: ${markerId}`);
            markersRef.current[markerId]?.remove();
            delete markersRef.current[markerId];
        },
        updateMarker: (markerData) => {
            if (!mapRef.current || !mapLoaded || !markersRef.current[markerData.id]) return;
            const marker = markersRef.current[markerData.id];
            const position = markerData.geometry.coordinates as [number, number];
            const color = getMarkerColor(markerData.properties.status);

            marker.setLngLat(position);
            // Update color of the div marker
            const markerElement = marker.getElement();
            markerElement.style.backgroundColor = color;
            
            marker.getPopup()?.setHTML(`
                <div>
                    <strong>${markerData.properties.address || 'Address N/A'}</strong><br>
                    Status: ${markerData.properties.status}<br>
                    ID: ${markerData.id}
                </div>
            `);
        },
    }));

    return (
        <div
            ref={mapContainer}
            className="absolute inset-0 w-full h-full"
            aria-label="Map showing property locations"
        />
    );
});

MapboxMap.displayName = "MapboxMap";

export default MapboxMap;
