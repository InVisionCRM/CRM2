declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element | null, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    addListener(eventName: string, handler: Function): MapsEventListener;
    getCenter(): LatLng;
    panTo(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
  }

  class Marker {
    constructor(opts: MarkerOptions);
    setMap(map: Map | null): void;
    addListener(eventName: string, handler: Function): MapsEventListener;
  }

  class Geocoder {
    geocode(
      request: { address: string } | { location: LatLng | LatLngLiteral },
      callback: (
        results: GeocoderResult[] | null,
        status: GeocoderStatus
      ) => void
    ): void;
  }

  interface MapOptions {
    center: LatLngLiteral;
    zoom: number;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  }

  interface MarkerOptions {
    position: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: Symbol;
  }

  interface Symbol {
    path: SymbolPath;
    scale: number;
    fillColor: string;
    fillOpacity: number;
    strokeWeight: number;
    strokeColor: string;
  }

  enum SymbolPath {
    CIRCLE = 0,
    FORWARD_CLOSED_ARROW = 1,
    FORWARD_OPEN_ARROW = 2,
    BACKWARD_CLOSED_ARROW = 3,
    BACKWARD_OPEN_ARROW = 4
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface GeocoderResult {
    geometry: {
      location: LatLng;
    };
    formatted_address: string;
  }

  interface MapMouseEvent {
    latLng?: LatLng;
  }

  interface MapsEventListener {
    remove(): void;
  }

  type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
} 