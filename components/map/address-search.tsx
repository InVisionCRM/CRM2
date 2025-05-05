"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { Loader } from "@googlemaps/js-api-loader"

interface AddressSearchProps {
  onAddressSelect: (result: {
    place_name: string
    center: { lat: number; lng: number }
  }) => void
}

export function AddressSearch({ onAddressSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchBoxRef = useRef<HTMLInputElement>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const geocoderService = useRef<google.maps.Geocoder | null>(null)

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places", "geocoding"],
    })

    loader.load().then((google) => {
      autocompleteService.current = new google.maps.places.AutocompleteService()
      const dummyDiv = document.createElement("div")
      placesService.current = new google.maps.places.PlacesService(dummyDiv)
      geocoderService.current = new google.maps.Geocoder()
      console.log("Google Places and Geocoding Services initialized for AddressSearch")
    }).catch(e => {
      console.error("Failed to load Google Maps API for AddressSearch:", e)
    })
  }, [])

  const fetchSuggestions = useCallback(() => {
    if (!query || !autocompleteService.current) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "us" },
        types: ['address']
      },
      (predictions, status) => {
        setIsLoading(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions)
        } else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.error("Autocomplete prediction failed:", status)
          setSuggestions([])
        } else {
          setSuggestions([])
        }
      }
    )
  }, [query])

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    debounceTimeout.current = setTimeout(fetchSuggestions, 300)

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [fetchSuggestions])

  const handleSelect = (suggestion: google.maps.places.AutocompletePrediction) => {
    setQuery(suggestion.description)
    setSuggestions([])
    setIsLoading(true)

    if (!placesService.current || !suggestion.place_id) {
      console.error("PlacesService not ready or place_id missing")
      setIsLoading(false)
      if (geocoderService.current && suggestion.description) {
        console.log("Falling back to Geocoder for:", suggestion.description)
        geocoderService.current.geocode({ address: suggestion.description }, (results, status) => {
          setIsLoading(false)
          if (status === google.maps.GeocoderStatus.OK && results?.[0]?.geometry?.location) {
            const location = results[0].geometry.location
            onAddressSelect({
              place_name: suggestion.description,
              center: { lat: location.lat(), lng: location.lng() },
            })
          } else {
            console.error("Geocoder fallback failed:", status)
          }
        })
      }
      return
    }

    placesService.current.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ["name", "formatted_address", "geometry.location"],
      },
      (place, status) => {
        setIsLoading(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          onAddressSelect({
            place_name: place.formatted_address || place.name || suggestion.description,
            center: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
          })
        } else {
          console.error("Place details request failed:", status)
          if (geocoderService.current && suggestion.description) {
            console.log("Falling back to Geocoder after Place Details failure for:", suggestion.description)
            geocoderService.current.geocode({ address: suggestion.description }, (results, geoStatus) => {
              if (geoStatus === google.maps.GeocoderStatus.OK && results?.[0]?.geometry?.location) {
                const location = results[0].geometry.location
                onAddressSelect({
                  place_name: suggestion.description,
                  center: { lat: location.lat(), lng: location.lng() },
                })
              } else {
                console.error("Geocoder fallback also failed:", geoStatus)
              }
            })
          }
        }
      }
    )
  }

  const handleCloseDropdown = () => {
    setSuggestions([])
  }

  return (
    <div className="relative w-full max-w-md">
      <Input
        ref={searchBoxRef}
        type="text"
        placeholder="Search for an address..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-500"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-sm rounded-md shadow-lg border border-gray-200">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-2 hover:bg-gray-100/90 cursor-pointer transition-colors duration-150 first:rounded-t-md last:border-0 border-b border-gray-100"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.description}
            </div>
          ))}
          <button 
            onClick={handleCloseDropdown}
            className="w-full py-1.5 text-xs text-gray-500 hover:bg-gray-100/90 rounded-b-md flex items-center justify-center border-t border-gray-100 transition-colors"
          >
            <X className="h-3 w-3 mr-1" />
            Close
          </button>
        </div>
      )}
    </div>
  )
}
