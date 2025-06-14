"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, RotateCcw, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RouteComparisonProps {
  currentRoute?: {
    totalDistance: string
    totalDuration: string
    isOptimized?: boolean
  }
  optimizedRoute?: {
    totalDistance: string
    totalDuration: string
  }
  onRestoreOptimized?: () => void
  className?: string
}

interface RouteMetrics {
  distance: number // in km
  duration: number // in minutes
}

function parseRouteMetrics(distance: string, duration: string): RouteMetrics {
  // Parse distance (e.g., "15.2 km" -> 15.2)
  const distanceNum = parseFloat(distance.replace(/[^\d.]/g, '')) || 0
  
  // Parse duration (e.g., "1h 25m" -> 85 minutes)
  const durationMatch = duration.match(/(?:(\d+)h\s*)?(?:(\d+)m)?/)
  const hours = parseInt(durationMatch?.[1] || '0')
  const minutes = parseInt(durationMatch?.[2] || '0')
  const durationNum = hours * 60 + minutes
  
  return { distance: distanceNum, duration: durationNum }
}

function formatDifference(value: number, unit: string, isTime: boolean = false): string {
  if (isTime) {
    const hours = Math.floor(Math.abs(value) / 60)
    const minutes = Math.abs(value) % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  return `${Math.abs(value).toFixed(1)} ${unit}`
}

export function RouteComparison({ 
  currentRoute, 
  optimizedRoute, 
  onRestoreOptimized,
  className = "" 
}: RouteComparisonProps) {
  const [showComparison, setShowComparison] = useState(false)

  // Show comparison when we have both routes and they're different
  useEffect(() => {
    if (currentRoute && optimizedRoute && !currentRoute.isOptimized) {
      const current = parseRouteMetrics(currentRoute.totalDistance, currentRoute.totalDuration)
      const optimal = parseRouteMetrics(optimizedRoute.totalDistance, optimizedRoute.totalDuration)
      
      // Show if there's a meaningful difference (>1 minute or >0.5km)
      const timeDiff = Math.abs(current.duration - optimal.duration)
      const distanceDiff = Math.abs(current.distance - optimal.distance)
      
      setShowComparison(timeDiff > 1 || distanceDiff > 0.5)
    } else {
      setShowComparison(false)
    }
  }, [currentRoute, optimizedRoute])

  if (!showComparison || !currentRoute || !optimizedRoute) {
    return null
  }

  const current = parseRouteMetrics(currentRoute.totalDistance, currentRoute.totalDuration)
  const optimal = parseRouteMetrics(optimizedRoute.totalDistance, optimizedRoute.totalDuration)

  const timeDiff = current.duration - optimal.duration
  const distanceDiff = current.distance - optimal.distance

  const isCurrentWorse = timeDiff > 0 || distanceDiff > 0
  const isCurrentBetter = timeDiff < 0 || distanceDiff < 0

  return (
    <Card className={cn("bg-black/40 backdrop-blur-md border-white/20 text-white", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isCurrentWorse && <TrendingUp className="h-4 w-4 text-orange-400" />}
            {isCurrentBetter && <TrendingDown className="h-4 w-4 text-green-400" />}
            Route Comparison
          </div>
          <Badge 
            variant={isCurrentWorse ? "destructive" : "secondary"}
            className={cn(
              "text-xs",
              isCurrentWorse && "bg-orange-500/20 text-orange-400 border-orange-500/50",
              isCurrentBetter && "bg-green-500/20 text-green-400 border-green-500/50"
            )}
          >
            {isCurrentWorse ? "Custom Route" : "Improved Route"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Metrics Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Route */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400">Your Route</h4>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-white">{currentRoute.totalDistance}</span>
                {distanceDiff !== 0 && (
                  <span className={cn(
                    "ml-2 text-xs",
                    distanceDiff > 0 ? "text-orange-400" : "text-green-400"
                  )}>
                    ({distanceDiff > 0 ? '+' : ''}{formatDifference(distanceDiff, 'km')})
                  </span>
                )}
              </div>
              <div className="text-sm">
                <span className="text-white">{currentRoute.totalDuration}</span>
                {timeDiff !== 0 && (
                  <span className={cn(
                    "ml-2 text-xs",
                    timeDiff > 0 ? "text-orange-400" : "text-green-400"
                  )}>
                    ({timeDiff > 0 ? '+' : ''}{formatDifference(timeDiff, 'min', true)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Optimized Route */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-400" />
              Optimized Route
            </h4>
            <div className="space-y-1">
              <div className="text-sm text-gray-300">{optimizedRoute.totalDistance}</div>
              <div className="text-sm text-gray-300">{optimizedRoute.totalDuration}</div>
            </div>
          </div>
        </div>

        {/* Comparison Summary */}
        <div className={cn(
          "p-3 rounded-lg border text-sm",
          isCurrentWorse && "bg-orange-500/10 border-orange-500/30 text-orange-200",
          isCurrentBetter && "bg-green-500/10 border-green-500/30 text-green-200"
        )}>
          {isCurrentWorse && (
            <div>
              <p className="font-medium mb-1">Your custom route is longer</p>
              <p className="text-xs opacity-80">
                The optimized route could save you{' '}
                {timeDiff > 0 && formatDifference(timeDiff, 'min', true)}
                {timeDiff > 0 && distanceDiff > 0 && ' and '}
                {distanceDiff > 0 && formatDifference(distanceDiff, 'km')}
              </p>
            </div>
          )}
          {isCurrentBetter && (
            <div>
              <p className="font-medium mb-1">Great! Your route is more efficient</p>
              <p className="text-xs opacity-80">
                You've saved{' '}
                {Math.abs(timeDiff) > 0 && formatDifference(timeDiff, 'min', true)}
                {Math.abs(timeDiff) > 0 && Math.abs(distanceDiff) > 0 && ' and '}
                {Math.abs(distanceDiff) > 0 && formatDifference(distanceDiff, 'km')}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isCurrentWorse && onRestoreOptimized && (
          <Button
            onClick={onRestoreOptimized}
            variant="outline"
            size="sm"
            className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Use Optimized Route
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 