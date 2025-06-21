"use client"

import { useEffect, useState } from "react"
import { Loader2, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog } from "lucide-react"
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
  const [showAll, setShowAll] = useState(false)

  // Macomb Township, MI coordinates
  const lat = 42.6655
  const lon = -82.9447

  const formatTemperature = (temp: number) => {
    const rounded = Math.round(temp)
    return rounded.toString().padStart(2, '0')
  }

  const getIconForCondition = (condition: string) => {
    switch (condition) {
      case 'clear':
        return <Sun className="w-6 h-6 text-yellow-400" />
      case 'clouds':
        return <Cloud className="w-6 h-6 text-gray-300" />
      case 'rain':
        return <CloudRain className="w-6 h-6 text-blue-400" />
      case 'snow':
        return <CloudSnow className="w-6 h-6 text-white" />
      case 'thunderstorm':
        return <CloudLightning className="w-6 h-6 text-purple-400" />
      case 'drizzle':
        return <CloudDrizzle className="w-6 h-6 text-cyan-300" />
      case 'fog':
      case 'mist':
        return <CloudFog className="w-6 h-6 text-gray-400" />
      default:
        return <Cloud className="w-6 h-6 text-gray-300" />
    }
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
        <div className={`grid gap-4 ${showAll ? 'grid-cols-7' : 'grid-cols-3'}`}>
          {(showAll ? forecast : forecast.slice(0,3)).map((day) => (
            <div
              key={day.fullDate.toISOString()}
              className="flex flex-col items-center p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => handleDayClick(day)}
            >
              <span className="text-sm font-medium text-white/80 leading-none mb-[1px]">{day.dayAbbr}</span>
              <span className="text-xs font-medium text-white/60 leading-none mb-[1px]">
                {day.monthAbbr} {day.dayOfMonth}
              </span>
              <div className="mb-[1px] flex items-center justify-center h-6 w-6">
                {getIconForCondition(day.condition)}
              </div>
              <span className="text-base font-semibold text-white leading-none">
                {formatTemperature(day.temp)}°
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 transition-colors rounded-md text-white/80 font-medium"
          >
            {showAll ? 'Show 3-Day' : 'Show 7-Day'} Forecast
          </button>

          <button
            onClick={() => setIsRadarOpen(true)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 transition-colors rounded-md text-white/80 font-medium"
          >
            Live Radar
          </button>
        </div>
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