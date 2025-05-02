import type { WeatherData, WeatherLocation, RoofingCondition } from "@/types/weather"

// This would normally be in an environment variable
const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "demo_key"
const BASE_URL = "https://api.openweathermap.org/data/3.0"

export async function fetchWeatherData(location: WeatherLocation): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/onecall?lat=${location.lat}&lon=${location.lon}&exclude=minutely&units=imperial&appid=${API_KEY}`,
    )

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      ...data,
      location,
    }
  } catch (error) {
    console.error("Error fetching weather data:", error)
    return null
  }
}

export async function searchLocation(query: string): Promise<WeatherLocation[]> {
  try {
    // Geocoding API
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`,
    )

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`)
    }

    const data = await response.json()
    return data.map((item: any) => ({
      name: item.name,
      lat: item.lat,
      lon: item.lon,
      address: `${item.name}, ${item.state || ""} ${item.country}`.trim(),
    }))
  } catch (error) {
    console.error("Error searching location:", error)
    return []
  }
}

export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }

    // Add specific error handling for permission issues
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        if (error.code === 1) {
          // PERMISSION_DENIED
          reject(
            new Error("Location permission denied. Please enable location access or search for a location manually."),
          )
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          reject(new Error("Location information is unavailable. Please search for a location manually."))
        } else if (error.code === 3) {
          // TIMEOUT
          reject(new Error("Location request timed out. Please try again or search for a location manually."))
        } else {
          reject(new Error("An unknown error occurred while retrieving your location."))
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  })
}

export function getWeatherIcon(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}

export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°F`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatHour(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  })
}

export function isToday(timestamp: number): boolean {
  const today = new Date()
  const date = new Date(timestamp * 1000)
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isTomorrow(timestamp: number): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const date = new Date(timestamp * 1000)
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  )
}

export function getRoofingConditions(weather: WeatherData): RoofingCondition {
  const { current, alerts } = weather

  // Check for severe weather alerts
  if (alerts && alerts.length > 0) {
    return {
      condition: "not_recommended",
      label: "Not Recommended",
      description: "Weather alerts in effect",
      icon: "alert-triangle",
    }
  }

  // Check wind speed (over 20 mph is dangerous for roofing)
  if (current.wind_speed > 20) {
    return {
      condition: "not_recommended",
      label: "Not Recommended",
      description: "High winds",
      icon: "wind",
    }
  }

  // Check for rain or snow
  if (current.weather.some((w) => w.main === "Rain" || w.main === "Snow")) {
    return {
      condition: "not_recommended",
      label: "Not Recommended",
      description: "Precipitation",
      icon: "cloud-rain",
    }
  }

  // Check temperature (below 40°F or above 90°F is not ideal for shingles)
  if (current.temp < 40) {
    return {
      condition: "caution",
      label: "Caution",
      description: "Cold temperatures",
      icon: "thermometer",
    }
  }

  if (current.temp > 90) {
    return {
      condition: "caution",
      label: "Caution",
      description: "Hot temperatures",
      icon: "thermometer",
    }
  }

  // Check humidity (high humidity can affect adhesives)
  if (current.humidity > 85) {
    return {
      condition: "caution",
      label: "Caution",
      description: "High humidity",
      icon: "droplets",
    }
  }

  // Ideal conditions
  if (current.temp >= 50 && current.temp <= 80 && current.wind_speed < 10 && current.humidity < 70) {
    return {
      condition: "ideal",
      label: "Ideal",
      description: "Perfect roofing conditions",
      icon: "check-circle",
    }
  }

  // Default to acceptable
  return {
    condition: "acceptable",
    label: "Acceptable",
    description: "Workable conditions",
    icon: "check",
  }
}
