"use client"

import { useState, useEffect } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StreetViewTooltipProps {
  address: string
  children: React.ReactNode
}

export function StreetViewTooltip({ address, children }: StreetViewTooltipProps) {
  const [imageUrl, setImageUrl] = useState<string>("")
  
  useEffect(() => {
    // Construct the Google Street View Static API URL
    // Note: You'll need to replace YOUR_API_KEY with an actual Google Maps API key
    const encodedAddress = encodeURIComponent(address)
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=300x200&location=${encodedAddress}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    setImageUrl(streetViewUrl)
  }, [address])

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0 overflow-hidden rounded-md border border-gray-200">
          {imageUrl && (
            <div className="relative w-[300px] h-[200px]">
              <img 
                src={imageUrl} 
                alt={`Street view of ${address}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                {address}
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 