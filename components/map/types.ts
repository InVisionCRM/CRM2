export interface MapLocation {
  lng: number
  lat: number
}

export interface Address {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  fullAddress?: string
}

export interface MapContextType {
  location: MapLocation | null
  address: Address | null
  isLoading: boolean
  error: string | null
  setLocation: (location: MapLocation | null) => void
  setAddress: (address: Address | null) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export interface MapPickerProps {
  initialLocation?: MapLocation
  onLocationSelect?: (location: MapLocation, address: Address | null) => void
  onMapInit?: (mapInstance: any) => void
  height?: string
  className?: string
}

export interface MapConfig {
  accessToken: string
  styleUrl: string
  defaultCenter: [number, number]
  defaultZoom: number
}

export interface MapboxMapProps {
  markers: any[]
  onMarkerClick: (marker: any) => void
  onMarkerAdd: (position: [number, number], address: string) => void
  accessToken: string
}

// Define the specific status type
export type PropertyVisitStatus =
  | "No Answer"
  | "Not Interested"
  | "Follow up"
  | "Inspected"
  | "In Contract"
