"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { SearchBar } from "@/components/ui/search-bar"
import debounce from 'lodash.debounce'

interface AddressSearchProps {
  onAddressSelect: (result: {
    place_name: string
    center: { lat: number; lng: number }
  }) => void
}

declare global {
  interface Window {
    google: any
  }
}

export function AddressSearch({ onAddressSelect }: AddressSearchProps) {
  const [searchValue, setSearchValue] = useState("")
  const [placesService, setPlacesService] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Load Google Places API
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || scriptRef.current) return

    scriptRef.current = document.createElement("script")
    scriptRef.current.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    scriptRef.current.async = true
    scriptRef.current.onload = () => {
      setPlacesService(new window.google.maps.places.AutocompleteService())
    }
    document.head.appendChild(scriptRef.current)

    return () => {
      if (scriptRef.current?.parentNode) {
        document.head.removeChild(scriptRef.current)
        scriptRef.current = null
      }
    }
  }, [])

  const searchAddress = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !placesService) return

      placesService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "us" },
          types: ["address"],
        },
        (predictions: any[] | null) => {
          if (!predictions) {
            setPredictions([])
            return
          }
          setPredictions(predictions)
        }
      )
    }, 300),
    [placesService]
  )

  const handleResultSelect = async (prediction: any) => {
    setSearchValue(prediction.description)
    setPredictions([])

    // Get lat/lng for the selected address
    const geocoder = new window.google.maps.Geocoder()
    try {
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ placeId: prediction.place_id }, (results: any, status: any) => {
          if (status === "OK") {
            resolve(results[0])
          } else {
            reject(new Error("Geocoding failed"))
          }
        })
      })

      const location = result.geometry.location
      onAddressSelect({
        place_name: prediction.description,
        center: {
          lat: location.lat(),
          lng: location.lng()
        }
      })
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <SearchBar
        value={searchValue}
        onChange={(e) => {
          const value = e.target.value
          setSearchValue(value)
          searchAddress(value)
        }}
        placeholder="Search for an address..."
        className="w-full"
      />
      
      {predictions.length > 0 && (
        <div className="absolute w-full mt-1 bg-black/50 border border-[#59ff00]/20 rounded-lg overflow-hidden z-50 backdrop-blur-md">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              className="w-full px-4 py-2 text-left text-white hover:bg-[#59ff00]/10 transition-colors"
              onClick={() => handleResultSelect(prediction)}
            >
              {prediction.description}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}