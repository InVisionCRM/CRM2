"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { WeatherOverviewDialog } from "./weather-overview-dialog"
import { WeatherRadarDialog } from "./weather-radar-dialog"

interface WeatherDay {
  dayAbbr: string
  monthAbbr: string
  dayOfMonth: number
  fullDate: Date
  temp: number
  condition: string
  icon: string
  loading?: boolean
  error?: string
}

export function WeatherForecast() {
  const [forecast, setForecast] = useState<WeatherDay[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRadarOpen, setIsRadarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Macomb Township, MI coordinates
  const lat = 42.6655
  const lon = -82.9447

  const formatTemperature = (temp: number) => {
    const rounded = Math.round(temp)
    return rounded.toString().padStart(2, '0')
  }

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch weather data" }))
          throw new Error(errorData.error || `Failed to fetch weather data: ${response.status}`)
        }
        
        const data = await response.json()
        const today = new Date()
        
        const days = data.daily.slice(0, 7).map((day: any, index: number) => {
          const date = new Date(today)
          date.setDate(today.getDate() + index)
          
          return {
            dayAbbr: date.toLocaleDateString('en-US', { weekday: 'short' }),
            monthAbbr: date.toLocaleDateString('en-US', { month: 'short' }),
            dayOfMonth: date.getDate(),
            fullDate: date,
            temp: Math.round(day.temp.day),
            condition: day.weather[0].main.toLowerCase(),
            icon: day.weather[0].icon
          }
        })
        
        setForecast(days)
      } catch (error) {
        console.error("Weather fetch error:", error)
        setError(error instanceof Error ? error.message : "Failed to load forecast")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeatherData()
  }, [lat, lon])

  const handleDayClick = (day: WeatherDay) => {
    setSelectedDay(`${day.dayAbbr}, ${day.monthAbbr} ${day.dayOfMonth}`)
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-3 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#59ff00]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-3 text-center text-red-400">
        {error}
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-3">
        <div className="grid grid-cols-7 gap-4">
          {forecast.map((day) => (
            <div
              key={day.fullDate.toISOString()}
              className="flex flex-col items-center p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => handleDayClick(day)}
            >
              <span className="text-sm font-medium text-white/80">{day.dayAbbr}</span>
              <span className="text-xs font-medium text-white/60 mb-2">
                {day.monthAbbr} {day.dayOfMonth}
              </span>
              <img 
                src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                alt={day.condition}
                className="w-10 h-10"
              />
              <span className="text-lg font-semibold text-white mt-1">
                {formatTemperature(day.temp)}°
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIsRadarOpen(true)}
          className="w-full mt-2 py-2 bg-white/5 hover:bg-white/10 transition-colors rounded-md text-white/80 font-medium"
        >
          Live Radar
        </button>
      </div>

      <WeatherOverviewDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedDay={selectedDay}
        lat={lat}
        lon={lon}
      />

      <WeatherRadarDialog
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
      />
    </>
  )
} 