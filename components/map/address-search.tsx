"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface AddressSearchProps {
  onAddressSelect: (result: any) => void
}

export function AddressSearch({ onAddressSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchBoxRef = useRef<HTMLInputElement>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (!query) {
      setSuggestions([])
      return
    }

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&country=us&types=address`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions")
        }

        const data = await response.json()
        setSuggestions(data.features || [])
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [query])

  const handleSelect = (suggestion: any) => {
    setQuery(suggestion.place_name)
    setSuggestions([])
    onAddressSelect({
      center: [suggestion.center[1], suggestion.center[0]],
      place_name: suggestion.place_name,
    })
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
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100/90 cursor-pointer transition-colors duration-150 first:rounded-t-md last:border-0 border-b border-gray-100"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.place_name}
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
