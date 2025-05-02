"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatTemperature, getWeatherIcon, getRoofingConditions } from "@/lib/weather"
import Image from "next/image"
import { Thermometer, Droplets, Wind, AlertTriangle, CheckCircle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WeatherData } from "@/types/weather"

interface WeatherConditionsProps {
  weatherData: WeatherData
}

export function WeatherConditions({ weatherData }: WeatherConditionsProps) {
  const { current, location } = weatherData
  const icon = getWeatherIcon(current.weather[0].icon)
  const description = current.weather[0].description
  const temp = formatTemperature(current.temp)
  const feelsLike = formatTemperature(current.feels_like)
  const humidity = `${current.humidity}%`
  const windSpeed = `${Math.round(current.wind_speed)} mph`

  const roofingCondition = getRoofingConditions(weatherData)

  const getConditionIcon = () => {
    switch (roofingCondition.icon) {
      case "alert-triangle":
        return <AlertTriangle className="h-4 w-4" />
      case "wind":
        return <Wind className="h-4 w-4" />
      case "cloud-rain":
        return <Wind className="h-4 w-4" />
      case "thermometer":
        return <Thermometer className="h-4 w-4" />
      case "droplets":
        return <Droplets className="h-4 w-4" />
      case "check-circle":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Check className="h-4 w-4" />
    }
  }

  const getConditionColor = () => {
    switch (roofingCondition.condition) {
      case "ideal":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-100"
      case "acceptable":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-100"
      case "caution":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-100"
      case "not_recommended":
        return "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-100"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">{location.name}</h2>
          <p className="text-sm text-muted-foreground">{location.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Image 
            src={icon || "/placeholder.svg"} 
            alt={description} 
            width={40} 
            height={40} 
            className="h-10 w-10" 
          />
          <div className="text-right">
            <p className="text-2xl font-bold leading-none">{temp}</p>
            <p className="text-xs text-muted-foreground">Feels {feelsLike}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Wind className="h-4 w-4 text-blue-500" />
          <span>{windSpeed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="h-4 w-4 text-blue-500" />
          <span>{humidity}</span>
        </div>
        <div className={cn("flex items-center gap-1.5 rounded-md px-1.5 py-0.5", getConditionColor())}>
          {getConditionIcon()}
          <span className="font-medium">{roofingCondition.label}</span>
        </div>
      </div>

      <p className="text-sm capitalize text-muted-foreground">{description}</p>
    </div>
  )
}
