"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Route, Loader2, Users, Navigation, Plus, X, GripVertical, ExternalLink } from "lucide-react"
import { ClientSelector } from "@/components/route-planner/client-selector"
import { AddressAutocomplete } from "@/components/route-planner/address-autocomplete"
import { RouteMap } from "@/components/route-planner/route-map"
import { RouteComparison } from "@/components/route-planner/route-comparison"

// Disable static generation for this page
export const dynamic = 'force-dynamic'

interface RouteResult {
  optimizedOrder: number[]
  totalDistance: string
  totalDuration: string
  routes: any[]
  legs?: any[]
  polyline?: any
  isOptimized?: boolean
}

interface SelectedClient {
  id: string
  name: string
  address: string
  type: 'client' | 'lead'
}

export default function RoutePlannerPage() {
  const [waypoints, setWaypoints] = useState<string[]>(["", "", ""])
  const [selectedClients, setSelectedClients] = useState<(SelectedClient | null)[]>([null, null, null])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RouteResult | null>(null)
  const [optimizedResult, setOptimizedResult] = useState<RouteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'clients' | 'addresses'>('clients')
  const [hasManuallyReordered, setHasManuallyReordered] = useState(false)

  // Memoized waypoint change handler to prevent unnecessary re-renders
  const handleWaypointChange = useCallback((index: number, value: string) => {
    setWaypoints(prev => {
      const newWaypoints = [...prev]
      newWaypoints[index] = value
      return newWaypoints
    })
    setError(null)
  }, [])

  // Handle client selection
  const handleClientSelect = useCallback((index: number, client: SelectedClient | null, address: string) => {
    setSelectedClients(prev => {
      const newClients = [...prev]
      newClients[index] = client
      return newClients
    })
    handleWaypointChange(index, address)
  }, [handleWaypointChange])

  // Memoized waypoints change handler for the map
  const handleWaypointsChange = useCallback((newWaypoints: string[]) => {
    // Check if this is a manual reorder (same waypoints, different order)
    const isSameWaypoints = newWaypoints.length === waypoints.length &&
      newWaypoints.every(wp => waypoints.includes(wp)) &&
      waypoints.every(wp => newWaypoints.includes(wp))
    
    if (isSameWaypoints && JSON.stringify(newWaypoints) !== JSON.stringify(waypoints)) {
      setHasManuallyReordered(true)
    }
    
    setWaypoints(newWaypoints)
    
    // Update selected clients array to match new waypoints length
    if (newWaypoints.length !== selectedClients.length) {
      setSelectedClients(prev => {
        const newClients = [...prev]
        while (newClients.length < newWaypoints.length) {
          newClients.push(null)
        }
        while (newClients.length > newWaypoints.length) {
          newClients.pop()
        }
        return newClients
      })
    }
    
    setError(null)
  }, [waypoints, selectedClients.length])

  const addWaypoint = useCallback(() => {
    setWaypoints(prev => [...prev, ""])
    setSelectedClients(prev => [...prev, null])
  }, [])

  const removeWaypoint = useCallback((index: number) => {
    if (waypoints.length <= 2) return // Keep minimum 2 waypoints
    setWaypoints(prev => prev.filter((_, i) => i !== index))
    setSelectedClients(prev => prev.filter((_, i) => i !== index))
  }, [waypoints.length])

  const handleViewLead = useCallback((client: SelectedClient) => {
    const path = client.type === 'lead' ? `/leads/${client.id}` : `/clients/${client.id}`
    window.open(path, '_blank')
  }, [])

  // Function to parse address and show only street address and city
  const getShortAddress = useCallback((fullAddress: string) => {
    if (!fullAddress || !fullAddress.trim()) return ''
    
    // Split by comma and take first two parts (street address and city)
    const parts = fullAddress.split(',').map(part => part.trim())
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`
    }
    return parts[0] || fullAddress
  }, [])

  const planRoute = async () => {
    const validWaypoints = waypoints.filter(wp => wp.trim())
    if (validWaypoints.length < 2) {
      setError("Please provide at least 2 addresses")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // For the API, we need origin, destination, and intermediates
      const origin = validWaypoints[0]
      const destination = validWaypoints[validWaypoints.length - 1]
      const intermediates = validWaypoints.slice(1, -1)

      // If we have more than 3 total waypoints, use Google Maps directly for now
      if (validWaypoints.length > 3) {
        // For now, we'll let the map handle multi-waypoint routing
        // The RouteMap component will calculate the route
        setError("Multi-stop routes are handled by the interactive map. Check the map view for your optimized route.")
        return
      }

      const requestBody = {
        origin,
        destination,
        intermediate: intermediates[0] || "" // For backwards compatibility with 3-point routes
      }

      const response = await fetch('/api/route-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to plan route')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRouteUpdate = useCallback((directions: any) => {
    if (directions && directions.routes && directions.routes.length > 0) {
      const route = directions.routes[0]
      
      // Calculate total distance and duration from legs
      let totalDistance = 0
      let totalDuration = 0
      
      route.legs.forEach((leg: any) => {
        totalDistance += leg.distance.value
        totalDuration += leg.duration.value
      })

      const formattedResult = {
        optimizedOrder: directions.request.waypoints?.map((_: any, index: number) => index) || [0, 1, 2],
        totalDistance: `${(totalDistance / 1000).toFixed(1)} m`,
        totalDuration: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`,
        routes: [route],
        legs: route.legs,
        polyline: route.overview_polyline,
        isOptimized: !hasManuallyReordered
      }

      setResult(formattedResult)
      
      // Store the first optimized result for comparison
      if (!hasManuallyReordered && !optimizedResult) {
        setOptimizedResult(formattedResult)
      }
    }
  }, [hasManuallyReordered, optimizedResult])

  const restoreOptimizedRoute = useCallback(() => {
    if (optimizedResult) {
      // This would require storing the original optimized waypoint order
      // For now, we'll trigger a re-optimization
      setHasManuallyReordered(false)
      setResult(optimizedResult)
    }
  }, [optimizedResult])

  const resetForm = useCallback(() => {
    setWaypoints(["", "", ""])
    setResult(null)
    setOptimizedResult(null)
    setError(null)
    setHasManuallyReordered(false)
  }, [])

  const getRouteStepDisplay = useCallback((stepIndex: number) => {
    if (!result || !waypoints[stepIndex]) return ""
    return waypoints[stepIndex]
  }, [result, waypoints])

  // Memoize the waypoint inputs to prevent unnecessary re-renders
  const waypointInputs = useMemo(() => {
    return waypoints.map((waypoint, index) => (
      <div key={`waypoint-${index}`} className="space-y-1 sm:space-y-2">
        <div className="flex items-end gap-1 sm:gap-2">
          <div className="flex-1 relative">
            {inputMode === 'clients' ? (
              <div className="relative">
                <ClientSelector
                  label={index === 0 ? "Starting Point" : 
                         index === waypoints.length - 1 ? "Final Destination" : 
                         `Stop ${index}`}
                  value={waypoint}
                  onChange={(value) => handleWaypointChange(index, value)}
                  onClientSelect={(client, address) => handleClientSelect(index, client, address)}
                  placeholder={`Search for ${index === 0 ? 'starting' : 
                              index === waypoints.length - 1 ? 'destination' : 'stop'} client...`}
                />
                {/* View Lead Button inside text box */}
                {selectedClients[index] && (
                  <div className="absolute right-1 sm:right-2 top-6 sm:top-8 flex justify-end">
                    <Button
                      onClick={() => handleViewLead(selectedClients[index]!)}
                      size="sm"
                      className="bg-blue-500/50 hover:bg-blue-500/70 text-white border-blue-500/50 text-xs px-1 sm:px-2 py-0.5 sm:py-1 h-5 sm:h-6"
                    >
                      <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">View {selectedClients[index]!.type === 'lead' ? 'Lead' : 'Client'}</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <AddressAutocomplete
                label={index === 0 ? "Starting Point" : 
                       index === waypoints.length - 1 ? "Final Destination" : 
                       `Stop ${index}`}
                value={waypoint}
                onChange={(value) => handleWaypointChange(index, value)}
                placeholder={`Enter ${index === 0 ? 'starting' : 
                            index === waypoints.length - 1 ? 'destination' : 'stop'} address...`}
                icon={<MapPin className={`h-3 w-3 sm:h-4 sm:w-4 ${
                  index === 0 ? 'text-green-400' : 
                  index === waypoints.length - 1 ? 'text-red-400' : 
                  'text-yellow-400'
                }`} />}
              />
            )}
          </div>
          {waypoints.length > 2 && index !== 0 && index !== waypoints.length - 1 && (
            <Button
              onClick={() => removeWaypoint(index)}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 mb-1 sm:mb-2 w-6 h-6 sm:w-8 sm:h-8 p-0"
            >
              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          )}
        </div>
        
        {/* Address Display */}
        {waypoint && waypoint.trim() && (
          <div className="text-xs text-gray-400 bg-black/20 p-1.5 sm:p-2 rounded border border-white/10">
            <div className="flex items-center gap-1 sm:gap-2">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
              <span className="truncate text-xs">{getShortAddress(waypoint)}</span>
            </div>
          </div>
        )}
      </div>
    ))
  }, [waypoints, inputMode, selectedClients, handleWaypointChange, handleClientSelect, removeWaypoint, handleViewLead, getShortAddress])

  return (
    <div className="min-h-screen bg-slate-900 p-2 sm:p-4">
      <div className="w-full px-2 sm:px-4">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center justify-center gap-2 sm:gap-3">
            <Route className="h-6 w-6 sm:h-8 sm:w-8 text-[#59ff00]" />
            <span className="hidden sm:inline">Advanced Route Planner</span>
            <span className="sm:hidden">Route Planner</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base hidden sm:block">Plan optimal routes with drag-and-drop reordering and interactive mapping</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-6 w-full">
          {/* Input Form */}
          <Card className="bg-black/40 backdrop-blur-md border-white/20 text-white xl:col-span-1 w-full">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#59ff00]" />
                <span className="hidden sm:inline">Route Planning</span>
                <span className="sm:hidden">Planning</span>
              </CardTitle>
              <CardDescription className="text-gray-300 text-sm hidden sm:block">
                Add waypoints and optimize your route
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-6 w-full">
              {/* Input Mode Selection */}
              <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'clients' | 'addresses')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/30 h-8 border-white/20 sm:h-10">
                  <TabsTrigger 
                    value="clients" 
                    className="data-[state=active]:bg-[#59ff00] data-[state=active]:text-black text-xs sm:text-sm py-1 sm:py-2"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="sm:inline">Clients</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="addresses"
                    className="data-[state=active]:bg-[#59ff00] data-[state=active]:text-black text-xs sm:text-sm py-1 sm:py-2"
                  >
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="sm:inline">Addresses</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="clients" className="space-y-3 sm:space-y-4 mt-3 sm:mt-6 w-full">
                  {waypointInputs}
                </TabsContent>

                <TabsContent value="addresses" className="space-y-3 sm:space-y-4 mt-3 sm:mt-6 w-full">
                  {waypointInputs}
                </TabsContent>
              </Tabs>

              {/* Add Waypoint Button */}
              <Button
                onClick={addWaypoint}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 h-8 sm:h-10 text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Another Stop</span>
                <span className="sm:hidden">Add Stop</span>
              </Button>

              {error && (
                <div className="p-2 sm:p-3 bg-red-500/20 border border-red-500/50 rounded-md w-full">
                  <p className="text-red-200 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 w-full">
                <Button
                  onClick={planRoute}
                  disabled={isLoading}
                  className="bg-[#59ff00] hover:bg-[#59ff00]/90 text-black font-medium flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Planning...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Route className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Plan Route</span>
                      <span className="sm:hidden">Plan</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Reset</span>
                  <span className="sm:hidden">↻</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Map and Route Comparison */}
          <div className="xl:col-span-2 space-y-3 sm:space-y-6 w-full">
            <RouteMap
              waypoints={waypoints}
              onWaypointsChange={handleWaypointsChange}
              optimizedRoute={result || undefined}
              onRouteUpdate={handleRouteUpdate}
              className="w-full"
            />
            
            {/* Route Comparison */}
            <RouteComparison
              currentRoute={result || undefined}
              optimizedRoute={optimizedResult || undefined}
              onRestoreOptimized={restoreOptimizedRoute}
            />
          </div>
        </div>

        {/* Results Summary */}
        {result && (
          <Card className="bg-black/40 backdrop-blur-md border-white/20 text-white mt-3 sm:mt-6 w-full">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Route className="h-4 w-4 sm:h-5 sm:w-5 text-[#59ff00]" />
                <span className="hidden sm:inline">Route Summary</span>
                <span className="sm:hidden">Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 w-full">
                {/* Route Stats */}
                <div className="space-y-2 sm:space-y-4 w-full">
                  <h4 className="font-medium text-white text-sm sm:text-base hidden sm:block">Route Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full">
                    <div className="p-2 sm:p-3 bg-black/30 rounded-lg border border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Distance</p>
                      <p className="text-sm sm:text-lg font-semibold text-white">{result.totalDistance}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-black/30 rounded-lg border border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Duration</p>
                      <p className="text-sm sm:text-lg font-semibold text-white">{result.totalDuration}</p>
                    </div>
                  </div>
                </div>

                {/* Route Order */}
                <div className="space-y-2 sm:space-y-3 md:col-span-2 w-full">
                  <h4 className="font-medium text-white flex items-center gap-2 text-sm sm:text-base">
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-[#59ff00]" />
                    <span className="hidden sm:inline">Optimized Route Order</span>
                    <span className="sm:hidden">Route Order</span>
                  </h4>
                  
                  <div className="space-y-1 sm:space-y-2 w-full">
                    {result.optimizedOrder.map((_, step) => (
                      <div 
                        key={step} 
                        className="flex items-center gap-2 sm:gap-3 p-2 bg-black/20 rounded border border-white/10 w-full"
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#59ff00] text-black rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                          {step + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs sm:text-sm truncate">
                            {getRouteStepDisplay(step) || 'Address not set'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3 sm:mt-6 w-full">
                <Button
                  onClick={() => {
                    const validWaypoints = waypoints.filter(wp => wp.trim())
                    const routeText = `Route Plan:\n${validWaypoints.map((wp, i) => `${i + 1}. ${wp}`).join('\n')}\n\nDistance: ${result.totalDistance}\nDuration: ${result.totalDuration}`
                    navigator.clipboard.writeText(routeText)
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10 h-8 sm:h-10 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Copy Details</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 