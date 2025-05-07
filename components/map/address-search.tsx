"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { SearchBar } from "@/components/ui/search-bar"
import debounce from 'lodash/debounce'

interface AddressSearchProps {
  onAddressSelect: (result: {
    place_name: string
    center: { lat: number; lng: number }
  }) => void
  accessToken: string;
}

interface GeocodingResult {
  place_name: string;
  center: [number, number];
}

export function AddressSearch({ onAddressSelect, accessToken }: AddressSearchProps) {
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const searchAddress = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 3) return;
      
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` + 
          `access_token=${accessToken}&` +
          'types=address,postcode,place&' +
          'country=us'
        );
        
        const data = await response.json();
        setSearchResults(data.features || []);
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [accessToken]
  );

  const handleResultSelect = (result: GeocodingResult) => {
    setSearchValue(result.place_name);
    setSearchResults([]);
    onAddressSelect({
      place_name: result.place_name,
      center: { lat: result.center[1], lng: result.center[0] },
    });
  };

  return (
    <div className="relative w-full max-w-md">
      <SearchBar
        value={searchValue}
        onChange={(e) => {
          const value = e.target.value;
          setSearchValue(value);
          searchAddress(value);
        }}
        placeholder="Search address..."
        className="w-full"
      />
      
      {/* Results dropdown */}
      {searchResults.length > 0 && (
        <div className="absolute w-full mt-1 bg-black/90 border border-[#59ff00]/20 rounded-lg overflow-hidden z-50 backdrop-blur-md">
          {searchResults.map((result, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left text-white hover:bg-[#59ff00]/10 transition-colors"
              onClick={() => handleResultSelect(result)}
            >
              {result.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
