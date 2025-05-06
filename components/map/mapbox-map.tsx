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
            });

            map.on("error", (e) => {
                console.error("[MapboxMap] MapLibre GL Error:", e.error?.message || e);
                setError(`Map error: ${e.error?.message || 'Unknown error'}`);
                setIsLoading(false);
            });

            // Handle Map Clicks (if handler provided)
            if (onMapClick) {
                map.on("click", async (e) => { // Make handler async
                    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
                    console.log("[MapboxMap] Map clicked at coords:", coords);

                    let fetchedAddress: string | undefined = undefined;
                    if (!accessToken) {
                        console.error("[MapboxMap] Mapbox access token is missing, cannot perform reverse geocoding.");
                    } else {
                        try {
                            // Call Mapbox Reverse Geocoding API
                            const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?access_token=${accessToken}&types=address&limit=1`;
                            console.log("[MapboxMap] Fetching address from:", geocodeUrl); // Log URL
                            const response = await fetch(geocodeUrl);
                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Geocoding failed: ${response.status} ${response.statusText} - ${errorText}`);
                            }
                            const data = await response.json();
                            if (data.features && data.features.length > 0) {
                                fetchedAddress = data.features[0].place_name; // Get the address string
                                console.log("[MapboxMap] Reverse geocoded address:", fetchedAddress);
                            } else {
                                console.warn("[MapboxMap] Reverse geocoding returned no features for coords:", coords);
                            }
                        } catch (error) {
                            console.error("[MapboxMap] Reverse geocoding fetch error:", error);
                            // Keep fetchedAddress as undefined, the parent will handle the fallback
                        }
                    }
                    // Call the prop with coordinates AND the fetched address (or undefined)
                    onMapClick(coords, fetchedAddress);
                });
            }

        } catch (error) {
            console.error("[MapboxMap] Failed to initialize map:", error);
            setError("Failed to initialize the map. Please check your Mapbox access token and network connection.");
            setIsLoading(false);
        }

        // Cleanup function
        return () => {
            console.log("[MapboxMap] Cleaning up map instance...");
            mapRef.current?.remove();
            mapRef.current = null;
            setMapLoaded(false);
            markersRef.current = {}; // Clear marker references
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, mapStyle, initialCenter.toString(), initialZoom, showUserLocation, onMapClick]); // Added onMapClick dependency


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
                
                // Skip invalid markers
                if (!geometry?.coordinates || geometry.coordinates.length !== 2) {
                    console.warn(`[MapboxMap] Skipping marker with invalid coordinates:`, markerData);
                    return;
                }
                
                const position = geometry.coordinates as [number, number]; // LngLat
                const color = getMarkerColor(properties.status);

                if (markersRef.current[id]) {
                    // Marker exists, check if update needed (e.g., position or color)
                    const existingMarker = markersRef.current[id];
                    const existingLngLat = existingMarker.getLngLat();
                    const existingColor = (existingMarker.getElement().firstChild as HTMLElement)?.style.color;

                    let needsUpdate = false;
                    if (existingLngLat.lng !== position[0] || existingLngLat.lat !== position[1]) {
                        console.log(`[MapboxMap] Updating marker position: ${id}`);
                        existingMarker.setLngLat(position);
                        needsUpdate = true;
                    }
                    // Simple color check - might need refinement based on how getMarkerColor works
                    if (existingColor !== color) {
                         console.log(`[MapboxMap] Updating marker color: ${id}`);
                        const markerElement = existingMarker.getElement();
                        const svgElement = markerElement.querySelector('svg');
                        if (svgElement) {
                           svgElement.style.fill = color;
                           svgElement.style.stroke = 'white'; // Optional: maintain stroke
                           svgElement.style.strokeWidth = '2px'; // Optional: maintain stroke width
                        }
                        needsUpdate = true;
                    }
                    if (needsUpdate) {
                        // Update popup content if necessary (example)
                         existingMarker.getPopup()?.setHTML(`
                            <div>
                                <strong>${properties.address || 'Address N/A'}</strong><br>
                                Status: ${properties.status}<br>
                                ID: ${id}
                            </div>
                        `);
                    }

                } else {
                    // Marker doesn't exist, create and add it
                     console.log(`[MapboxMap] Adding marker: ${id}`);
                     const markerElement = document.createElement('div');
                     markerElement.innerHTML = `
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="white" stroke-width="1.5" style="cursor: pointer; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.5));">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                        </svg>
                     `;
                     markerElement.style.width = '32px';
                     markerElement.style.height = '32px';

                    const marker = new Marker({ element: markerElement })
                        .setLngLat(position)
                        .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
                            <div>
                                <strong>${properties.address || 'Address N/A'}</strong><br>
                                Status: ${properties.status}<br>
                                ID: ${id}
                            </div>
                        `))
                        .addTo(map);

                    // Add click listener
                    marker.getElement().addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent map click event
                        console.log(`[MapboxMap] Marker clicked: ${id}`);
                        onMarkerClick(markerData);
                         // Optional: Fly to marker on click
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
            // This might be redundant if parent manages markersData prop,
            // but can be useful for temporary additions
            if (!mapRef.current || !mapLoaded || markersRef.current[markerData.id]) return;
            console.log(`[MapboxMap] Imperatively adding marker: ${markerData.id}`);

            const position = markerData.geometry.coordinates as [number, number];
            const color = getMarkerColor(markerData.properties.status);
            const markerElement = document.createElement('div');
                 markerElement.innerHTML = `
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="white" stroke-width="1.5" style="cursor: pointer; filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.5));">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                    </svg>
                 `;
                 markerElement.style.width = '32px';
                 markerElement.style.height = '32px';

            const marker = new Marker({ element: markerElement })
                .setLngLat(position)
                .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
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
            console.log(`[MapboxMap] Imperatively updating marker: ${markerData.id}`);
             const marker = markersRef.current[markerData.id];
             const position = markerData.geometry.coordinates as [number, number];
             const color = getMarkerColor(markerData.properties.status);

             marker.setLngLat(position);

             // Update color via SVG fill
             const markerElement = marker.getElement();
             const svgElement = markerElement.querySelector('svg');
             if (svgElement) {
                 svgElement.style.fill = color;
             }

             // Update popup
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
