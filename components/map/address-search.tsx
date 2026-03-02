"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import debounce from 'lodash.debounce'
import { Search } from "lucide-react"

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

    const geocoder = new window.google.maps.Geocoder()
    try {
      const result = await new Promise<{ geometry: { location: { lat: () => number; lng: () => number } } }>((resolve, reject) => {
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
    <div className="relative w-64 sm:w-72">
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => {
            const value = e.target.value
            setSearchValue(value)
            searchAddress(value)
          }}
          placeholder="Search address..."
          className="w-full text-sm px-3 py-2 pl-8 bg-slate-800/90 text-white placeholder-white/50 border border-slate-600 rounded-md focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500/50"
        />
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="h-3.5 w-3.5 text-white/50" />
        </div>
      </div>

      {predictions.length > 0 && (
        <div className="absolute w-full mt-1 bg-white border border-slate-300 rounded-md overflow-hidden z-50 shadow-lg text-sm text-black">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-3 py-1.5 text-left text-black hover:bg-slate-100 transition-colors"
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
