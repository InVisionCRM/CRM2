"use client"

import { useState, useEffect } from "react"
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LocationSearch } from "@/components/weather/location-search"
import { WeatherConditions } from "@/components/weather/weather-conditions"
import { WeatherAlertComponent } from "@/components/weather/weather-alert"
import { HourlyForecast } from "@/components/weather/hourly-forecast"
import { fetchWeatherData } from "@/lib/weather"
import type { WeatherData, WeatherLocation } from "@/types/weather"

interface WeatherWidgetProps {
  onClose: () => void
  initialLocation?: WeatherLocation
}

export function WeatherWidget({ onClose, initialLocation }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState<boolean>(false)

  const handleSelectLocation = async (location: WeatherLocation) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchWeatherData(location)
      if (data) {
        setWeatherData(data)
      } else {
        setError("Unable to fetch weather data. Please try again.")
      }
    } catch (err) {
      setError("An error occurred while fetching weather data.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (initialLocation) {
      handleSelectLocation(initialLocation)
    }
  }, [initialLocation])

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!weatherData && !initialLocation) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Weather</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-md text-sm">
            <p>Search for a location or use your current location to view weather conditions.</p>
          </div>
          <LocationSearch onSelectLocation={handleSelectLocation} isLoading={isLoading} />
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Weather</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main weather conditions */}
        <WeatherConditions weatherData={weatherData!} />

        {/* Weather Alerts */}
        {weatherData?.alerts && weatherData.alerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Active Alerts</h3>
            <ScrollArea className="h-[100px]">
              {weatherData.alerts.map((alert, index) => (
                <WeatherAlertComponent key={index} alert={alert} />
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Toggle for detailed forecast */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <><ChevronUp className="h-4 w-4 mr-2" /> Hide detailed forecast</>
          ) : (
            <><ChevronDown className="h-4 w-4 mr-2" /> Show detailed forecast</>
          )}
        </Button>

        {/* Detailed forecast */}
        {showDetails && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Hourly Forecast</h3>
                <HourlyForecast hourlyData={weatherData!.hourly} />
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
