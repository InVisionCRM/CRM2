"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface StreetViewImageProps {
  address: string
  position: [number, number]
  className?: string
  status?: string
  onStatusChange?: (status: string) => void
  showStatus?: boolean
}

const statusOptions = [
  { value: "No Answer", label: "No Answer", color: "bg-blue-500" },
  { value: "Not Interested", label: "Not Interested", color: "bg-red-500" },
  { value: "Inspected", label: "Inspected", color: "bg-green-500" },
  { value: "Follow-up", label: "Follow-up", color: "bg-amber-500" },
  { value: "In Contract", label: "In Contract", color: "bg-indigo-500" },
]

export function StreetViewImage({ 
  address, 
  position, 
  className,
  status,
  onStatusChange,
  showStatus = false
}: StreetViewImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStreetView = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Construct the Street View Static API URL
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        const [lat, lng] = position
        console.log('Street View position:', { lat, lng }) // Debug log
        
        const size = "600x600" // Square size for better scaling
        const heading = "0" // 0 degrees (facing north)
        const pitch = "0" // Level view
        const fov = "90" // Field of view
        
        const url = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${apiKey}`
        console.log('Street View URL:', url) // Debug log
        
        setImageUrl(url)
      } catch (err) {
        setError("Failed to load street view image")
        console.error("Error fetching street view:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (position && position[0] !== 0 && position[1] !== 0) {
      fetchStreetView()
    }
  }, [position])

  if (error) {
    return (
      <div className={cn("w-full h-full bg-gray-100 flex items-center justify-center", className)}>
        <p className="text-gray-500">Unable to load street view</p>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden group", className)}>
      {isLoading ? (
        <div className="w-full h-full bg-gray-100 animate-pulse" />
      ) : (
        <>
          <img
            src={imageUrl}
            alt={`Street view of ${address}`}
            className="w-full h-full object-cover"
          />
          {showStatus && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex justify-between items-end">
                  <p className="text-white text-sm font-medium">{address}</p>
                  <div className="flex flex-col gap-2">
                    {statusOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        size="sm"
                        onClick={() => onStatusChange?.(option.value)}
                        className={cn(
                          "text-xs py-1 h-auto bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200",
                          status === option.value && "bg-white/40 border-white/50 shadow-lg scale-105"
                        )}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
} 