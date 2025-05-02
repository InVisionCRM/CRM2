"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Cloud, AlertTriangle, Loader2 } from "lucide-react"
import { WeatherWidget } from "@/components/weather/weather-widget"
import { formatTemperature, getWeatherIcon, getRoofingConditions } from "@/lib/weather"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { WeatherData, WeatherLocation } from "@/types/weather"

interface AppointmentWeatherProps {
  address: string
  date: Date
  lat?: number
  lon?: number
  weatherData?: WeatherData | null
  isLoading?: boolean
}

export function AppointmentWeather({
  address,
  date,
  lat,
  lon,
  weatherData,
  isLoading = false,
}: AppointmentWeatherProps) {
  const [isWeatherOpen, setIsWeatherOpen] = useState(false)

  const location: WeatherLocation | undefined =
    lat && lon
      ? {
          name: "Appointment Location",
          address,
          lat,
          lon,
          isJobSite: true,
        }
      : undefined

  // If we have weather data, show a summary
  if (weatherData) {
    const { current } = weatherData
    const icon = getWeatherIcon(current.weather[0].icon)
    const description = current.weather[0].description
    const temp = formatTemperature(current.temp)
    const roofingCondition = getRoofingConditions(weatherData)

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image src={icon || "/placeholder.svg"} alt={description} width={40} height={40} className="h-10 w-10" />
              <div className="ml-2">
                <p className="text-sm font-medium">{temp}</p>
                <p className="text-xs capitalize">{description}</p>
              </div>
            </div>

            <div
              className={cn(
                "px-2 py-1 rounded text-xs font-medium flex items-center",
                roofingCondition.condition === "ideal"
                  ? "bg-green-100 text-green-800"
                  : roofingCondition.condition === "acceptable"
                    ? "bg-blue-100 text-blue-800"
                    : roofingCondition.condition === "caution"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800",
              )}
            >
              {roofingCondition.condition === "not_recommended" && <AlertTriangle className="h-3 w-3 mr-1" />}
              {roofingCondition.label}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs h-8"
            onClick={() => setIsWeatherOpen(true)}
          >
            <Cloud className="h-3 w-3 mr-1" />
            View Full Forecast
          </Button>
        </CardContent>

        {isWeatherOpen && location && (
          <WeatherWidget onClose={() => setIsWeatherOpen(false)} initialLocation={location} />
        )}
      </Card>
    )
  }

  // Otherwise show a button to check weather
  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={() => setIsWeatherOpen(true)}
      disabled={!location || isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
      Check Weather
      {isWeatherOpen && location && (
        <WeatherWidget onClose={() => setIsWeatherOpen(false)} initialLocation={location} />
      )}
    </Button>
  )
}
