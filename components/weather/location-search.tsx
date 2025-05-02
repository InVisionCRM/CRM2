"use client"

import { useState } from "react"
import { Search, MapPin, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { searchLocation, getCurrentLocation } from "@/lib/weather"
import type { WeatherLocation } from "@/types/weather"

interface LocationSearchProps {
  onSelectLocation: (location: WeatherLocation) => void
  isLoading: boolean
}

export function LocationSearch({ onSelectLocation, isLoading }: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<WeatherLocation[]>([])
  const [searching, setSearching] = useState(false)
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setSearching(true)
    setLocationError(null)
    try {
      const locations = await searchLocation(query)
      setResults(locations)
      if (locations.length === 0) {
        setLocationError("No locations found. Please try a different search term.")
      }
    } catch (error) {
      console.error("Error searching locations:", error)
      setLocationError("Failed to search locations. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  const handleGetCurrentLocation = async () => {
    setGettingCurrentLocation(true)
    setLocationError(null)
    try {
      const position = await getCurrentLocation()
      const { latitude, longitude } = position.coords

      onSelectLocation({
        name: "Current Location",
        lat: latitude,
        lon: longitude,
        isCurrent: true,
      })
    } catch (error) {
      console.error("Error getting current location:", error)
      setLocationError(error instanceof Error ? error.message : "Failed to get current location")
    } finally {
      setGettingCurrentLocation(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={!query.trim() || searching || isLoading}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {locationError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <Button
        variant="outline"
        className="w-full flex items-center gap-2"
        onClick={handleGetCurrentLocation}
        disabled={gettingCurrentLocation || isLoading}
      >
        {gettingCurrentLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        Use Current Location
      </Button>

      {results.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <div className="divide-y">
            {results.map((location, index) => (
              <button
                key={index}
                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-start"
                onClick={() => onSelectLocation(location)}
                disabled={isLoading}
              >
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <span>{location.address || location.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
