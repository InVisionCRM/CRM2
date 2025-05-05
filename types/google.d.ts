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

  // Add Places API definitions
  namespace places {
    class AutocompleteService {
      constructor();
      getPlacePredictions(
        request: AutocompletionRequest,
        callback: (
          predictions: AutocompletePrediction[] | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }

    class PlacesService {
      constructor(attrContainer: HTMLElement | Map);
      getDetails(
        request: PlaceDetailsRequest,
        callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
      ): void;
    }

    interface AutocompletionRequest {
      input: string;
      bounds?: LatLngBounds | LatLngBoundsLiteral;
      componentRestrictions?: ComponentRestrictions;
      location?: LatLng | LatLngLiteral;
      offset?: number;
      radius?: number;
      types?: string[];
    }

    interface ComponentRestrictions {
      country: string | string[];
    }

    interface AutocompletePrediction {
      description: string;
      matched_substrings: PredictionSubstring[];
      place_id: string;
      structured_formatting: StructuredFormatting;
      terms: PredictionTerm[];
      types: string[];
    }

    interface PredictionTerm {
      offset: number;
      value: string;
    }

    interface PredictionSubstring {
      length: number;
      offset: number;
    }

    interface StructuredFormatting {
      main_text: string;
      main_text_matched_substrings: PredictionSubstring[];
      secondary_text: string;
    }

    interface PlaceDetailsRequest {
      placeId: string;
      fields?: string[];
    }

    interface PlaceResult {
      address_components?: AddressComponent[];
      formatted_address?: string;
      geometry?: PlaceGeometry;
      name?: string;
      place_id?: string;
    }

    interface PlaceGeometry {
      location: LatLng;
      viewport: LatLngBounds;
    }

    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    enum PlacesServiceStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      NOT_FOUND = 'NOT_FOUND'
    }
  }
} 