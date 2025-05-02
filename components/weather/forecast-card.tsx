"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatDate, formatTemperature, getWeatherIcon } from "@/lib/weather"
import Image from "next/image"
import { Droplets, Wind } from "lucide-react"
import type { DailyForecast } from "@/types/weather"

interface ForecastCardProps {
  forecast: DailyForecast
}

export function ForecastCard({ forecast }: ForecastCardProps) {
  const date = formatDate(forecast.dt)
  const icon = getWeatherIcon(forecast.weather[0].icon)
  const description = forecast.weather[0].description
  const highTemp = formatTemperature(forecast.temp.max)
  const lowTemp = formatTemperature(forecast.temp.min)
  const precipProbability = Math.round(forecast.pop * 100)
  const windSpeed = Math.round(forecast.wind_speed)

  return (
    <Card className="h-full">
      <CardContent className="p-3 flex flex-col items-center">
        <p className="text-sm font-medium text-center mb-1">{date}</p>
        <div className="flex justify-center my-1">
          <Image
            src={icon || "/placeholder.svg"}
            alt={description}
            width={50}
            height={50}
            className="h-12 w-12 object-contain"
          />
        </div>
        <p className="text-xs capitalize text-center mb-1">{description}</p>
        <div className="flex justify-center gap-2 mb-2">
          <span className="text-sm font-medium">{highTemp}</span>
          <span className="text-xs text-muted-foreground self-end">{lowTemp}</span>
        </div>
        <div className="flex justify-center gap-3 mt-auto text-xs text-muted-foreground">
          <div className="flex items-center">
            <Droplets className="h-3 w-3 mr-1" />
            <span>{precipProbability}%</span>
          </div>
          <div className="flex items-center">
            <Wind className="h-3 w-3 mr-1" />
            <span>{windSpeed} mph</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
