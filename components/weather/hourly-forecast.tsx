"use client"

import { useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatHour, formatTemperature, getWeatherIcon, isTomorrow } from "@/lib/weather"
import type { HourlyForecast } from "@/types/weather"

interface HourlyForecastProps {
  hourlyData: HourlyForecast[]
}

export function HourlyForecast({ hourlyData }: HourlyForecastProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  // Get the next 24 hours of forecast
  const next24Hours = hourlyData.slice(0, 24)

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Hourly Forecast</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {next24Hours.map((hour, index) => {
          const time = formatHour(hour.dt)
          const temp = formatTemperature(hour.temp)
          const icon = getWeatherIcon(hour.weather[0].icon)
          const precipProbability = Math.round(hour.pop * 100)

          // Add day label for first hour and when day changes
          let dayLabel = null
          if (index === 0) {
            dayLabel = "Today"
          } else {
            const prevHour = next24Hours[index - 1]
            const currentDate = new Date(hour.dt * 1000)
            const prevDate = new Date(prevHour.dt * 1000)

            if (currentDate.getDate() !== prevDate.getDate()) {
              dayLabel = isTomorrow(hour.dt)
                ? "Tomorrow"
                : new Date(hour.dt * 1000).toLocaleDateString("en-US", { weekday: "short" })
            }
          }

          return (
            <div key={hour.dt} className="flex-shrink-0">
              {dayLabel && (
                <div className="text-xs font-medium text-center mb-1 bg-muted px-2 py-0.5 rounded-sm">{dayLabel}</div>
              )}
              <Card className="w-16">
                <CardContent className="p-2 text-center">
                  <div className="text-xs">{time}</div>
                  <Image
                    src={icon || "/placeholder.svg"}
                    alt={hour.weather[0].description}
                    width={40}
                    height={40}
                    className="mx-auto"
                  />
                  <div className="text-sm font-medium">{temp}</div>
                  {precipProbability > 0 && (
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Droplets className="h-3 w-3 mr-0.5" />
                      <span>{precipProbability}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
