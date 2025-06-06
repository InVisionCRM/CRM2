"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Wind, Droplets, Loader2, Sunrise, Sunset } from "lucide-react"
import { useState, useEffect } from "react"

interface HourlyWeather {
  time: number
  temp: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  precipitation: number
  icon: string
  feelsLike: number
}

interface WeatherOverview {
  date: string
  temp: number
  condition: string
  description: string
  humidity?: number
  windSpeed?: number
  windDirection?: string
  feelsLike?: number
  hourly?: HourlyWeather[]
  sunrise?: number
  sunset?: number
  icon?: string
  loading?: boolean
  error?: string
}

interface WeatherOverviewDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedDay: string | null
  lat: number
  lon: number
}

export function WeatherOverviewDialog({ isOpen, onClose, selectedDay, lat, lon }: WeatherOverviewDialogProps) {
  const [weatherData, setWeatherData] = useState<WeatherOverview>({
    date: "",
    temp: 0,
    condition: "",
    description: "",
    loading: true
  })

  useEffect(() => {
    if (!isOpen || !selectedDay) return

    const fetchWeatherOverview = async () => {
      try {
        setWeatherData(prev => ({ ...prev, loading: true }))
        const response = await fetch(`/api/weather/overview?lat=${lat}&lon=${lon}&date=${encodeURIComponent(selectedDay)}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch weather data" }))
          throw new Error(errorData.error || `Failed to fetch weather data: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Weather overview data received:', data)
        
        setWeatherData({
          date: selectedDay,
          temp: data.temp,
          condition: data.condition,
          description: data.description,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          feelsLike: data.feelsLike,
          hourly: data.hourly,
          sunrise: data.sunrise,
          sunset: data.sunset,
          icon: data.icon,
          loading: false
        })
      } catch (error) {
        console.error("Weather fetch error:", error)
        setWeatherData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load weather overview'
        }))
      }
    }

    fetchWeatherOverview()
  }, [isOpen, selectedDay, lat, lon])

  const formatHour = (hour: number) => {
    return hour === 0 ? "12 AM" : 
           hour === 12 ? "12 PM" : 
           hour < 12 ? `${hour} AM` : 
           `${hour - 12} PM`
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatTemperature = (temp: number) => {
    const rounded = Math.round(temp)
    return rounded.toString().padStart(2, '0')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-black/95 to-black/90 border-white/20 text-white max-w-3xl p-0 gap-0">
        {/* Header with date and time */}
        <div className="flex items-center p-4 border-b border-white/10">
          <span className="text-lg font-medium">{selectedDay}</span>
          <span className="mx-2 text-white/40">•</span>
          <span className="text-lg text-white/70">{getCurrentTime()}</span>
        </div>

        <div className="flex divide-x divide-white/10">
          {/* Left panel - Current conditions */}
          <div className="w-1/2 p-6 space-y-6">
            <div className="flex flex-col items-center space-y-2">
              {weatherData.icon && (
                <img 
                  src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                  alt={weatherData.description}
                  className="w-24 h-24"
                />
              )}
              <div className="text-5xl font-bold">{formatTemperature(weatherData.temp)}°</div>
              <div className="text-xl text-white/80 capitalize">{weatherData.description}</div>
              {weatherData.feelsLike && (
                <div className="text-sm text-white/60">
                  Feels like {formatTemperature(weatherData.feelsLike)}°
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sunrise className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm">{weatherData.sunrise && formatTime(weatherData.sunrise)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sunset className="h-5 w-5 text-orange-400" />
                  <span className="text-sm">{weatherData.sunset && formatTime(weatherData.sunset)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wind className="h-5 w-5 text-blue-300" />
                  <span className="text-sm">
                    {weatherData.windSpeed} mph {weatherData.windDirection}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-400" />
                  <span className="text-sm">{weatherData.humidity}% humidity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Hourly forecast */}
          <div className="w-1/2 p-6">
            <h3 className="text-lg font-medium mb-4">Hourly Forecast</h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
              {weatherData.hourly?.map((hour) => (
                <div
                  key={hour.time}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <span className="text-sm font-medium w-16">
                      {formatHour(hour.time)}
                    </span>
                    {hour.icon && (
                      <img 
                        src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                        alt={hour.description}
                        className="w-8 h-8"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-white/60">
                      {hour.precipitation}%
                    </span>
                    <span className="text-sm font-medium w-12 text-right">
                      {formatTemperature(hour.temp)}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 