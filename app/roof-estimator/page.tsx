"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { RoofAreaEstimator } from "@/components/map/RoofAreaEstimator"
import { AddressSearch } from "@/components/map/address-search"


export default function RoofEstimatorPage() {
  const searchParams = useSearchParams()
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | undefined>()

  useEffect(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    console.log('Roof estimator page - URL params:', { lat, lng })
    
    if (lat && lng) {
      const coords = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      }
      console.log('Setting initial center to:', coords)
      setInitialCenter(coords)
    } else {
      console.log('No coordinates provided, will use default center')
    }
  }, [searchParams])

  const handleAddressSelect = (result: {
    place_name: string
    center: { lat: number; lng: number }
  }) => {
    console.log('Address selected on page:', result)
    setInitialCenter(result.center)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-slate-800/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-lime-400">
              Roof Area Estimator
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">
              Professional Roof Measurement Tool
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Draw multiple structures (house, garage, shed) and apply complexity multipliers for accurate material estimates.
            </p>
            
            {/* Address Search positioned between description and map */}
            <div className="mb-4">
              <AddressSearch onAddressSelect={handleAddressSelect} />
            </div>
          </div>

          <div className="h-[calc(100vh-240px)] min-h-[600px]">
            <RoofAreaEstimator initialCenter={initialCenter} />
          </div>
        </div>
      </div>
    </div>
  )
} 