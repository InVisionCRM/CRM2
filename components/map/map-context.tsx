"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { MapContextType, MapLocation, Address } from "./types"

// Create context with default values
const MapContext = createContext<MapContextType>({
  location: null,
  address: null,
  isLoading: false,
  error: null,
  setLocation: () => {},
  setAddress: () => {},
  setIsLoading: () => {},
  setError: () => {},
})

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<MapLocation | null>(null)
  const [address, setAddress] = useState<Address | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <MapContext.Provider
      value={{
        location,
        address,
        isLoading,
        error,
        setLocation,
        setAddress,
        setIsLoading,
        setError,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export const useMapContext = () => useContext(MapContext)
