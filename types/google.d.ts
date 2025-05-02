declare namespace google.maps {
  class Geocoder {
    geocode(
      request: { address: string },
      callback: (
        results: GeocoderResult[] | null,
        status: GeocoderStatus
      ) => void
    ): void;
  }

  interface GeocoderResult {
    geometry: {
      location: {
        lat(): number;
        lng(): number;
      };
    };
  }

  type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
} 