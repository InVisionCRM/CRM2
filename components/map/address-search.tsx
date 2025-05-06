"use client"

import { useRef, useEffect, useCallback } from "react"
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

interface AddressSearchProps {
  onAddressSelect: (result: {
    place_name: string
    center: { lat: number; lng: number }
  }) => void
  accessToken: string;
}

export function AddressSearch({ onAddressSelect, accessToken }: AddressSearchProps) {
  const geocoderContainerRef = useRef<HTMLDivElement>(null);
  const geocoderInitialized = useRef(false);

  useEffect(() => {
    if (geocoderContainerRef.current && !geocoderInitialized.current && accessToken) {
      const geocoder = new MapboxGeocoder({
        accessToken: accessToken,
        types: 'address,postcode,place',
        countries: 'us',
      });

      geocoder.addTo(geocoderContainerRef.current);

      geocoder.on('result', (e) => {
        const result = e.result;
        console.log('Mapbox Geocoder Result:', result);

        if (result?.center && result?.place_name) {
          const [lng, lat] = result.center;
          onAddressSelect({
            place_name: result.place_name,
            center: { lat, lng },
          });
        }
      });
      
      geocoderInitialized.current = true; 

      return () => {
         if (geocoderContainerRef.current) {
            geocoderContainerRef.current.innerHTML = ''; 
         }
         geocoderInitialized.current = false;
      };
    }
  }, [accessToken, onAddressSelect]);

  return (
    <div ref={geocoderContainerRef} className="mapbox-geocoder-container w-full max-w-md">
       <style jsx global>{`
        .mapboxgl-ctrl-geocoder {
          width: 100%;
          max-width: none;
          font-size: 1rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
           border-radius: 0.375rem;
        }
         .mapboxgl-ctrl-geocoder input[type='text'] {
           padding: 0.5rem 0.75rem;
           border-radius: 0.375rem;
           background-color: rgba(255, 255, 255, 0.9);
         }
         .mapboxgl-ctrl-geocoder .suggestions {
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(4px);
            border-radius: 0.375rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
         }
       `}</style>
    </div>
  );
}
