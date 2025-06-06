import { NextResponse } from "next/server"

// In a real app, this would be in an environment variable
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "YOUR_API_KEY"
const API_BASE_URL = "https://api.openweathermap.org/data/3.0/onecall"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    const dateStr = searchParams.get("date") // Format: "Thu, Jun 5"

    if (!lat || !lon || !dateStr) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Parse the date string to get the day index
    const today = new Date()
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const [dayAbbr] = dateStr.split(",") // Get "Thu" from "Thu, Jun 5"
    
    // Find how many days from today
    const todayIndex = today.getDay()
    const targetIndex = days.indexOf(dayAbbr)
    let daysFromToday = targetIndex - todayIndex
    if (daysFromToday < 0) daysFromToday += 7 // Handle wrap around to next week

    // Call OpenWeather One Call API 3.0
    const response = await fetch(
      `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial&exclude=minutely,alerts`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenWeather API error:", errorText)
      
      if (response.status === 401) {
        throw new Error("Invalid API key or unauthorized access to One Call API 3.0")
      } else if (response.status === 429) {
        throw new Error("API call limit exceeded for One Call API 3.0")
      }
      
      throw new Error(`Failed to fetch weather data: ${errorText}`)
    }

    const data = await response.json()

    // Detailed logging of API response
    console.log('API Response - Selected day data:', daysFromToday === 0 
      ? {
          current: {
            temp: data.current.temp,
            weather: data.current.weather[0],
            dt: new Date(data.current.dt * 1000)
          }
        }
      : {
          daily: {
            temp: data.daily[daysFromToday].temp,
            weather: data.daily[daysFromToday].weather[0],
            dt: new Date(data.daily[daysFromToday].dt * 1000)
          }
        }
    )

    // Get the daily forecast for the requested day
    const dailyData = daysFromToday === 0 
      ? {
          temp: data.current.temp,
          condition: data.current.weather[0].main,
          description: data.current.weather[0].description,
          humidity: data.current.humidity,
          windSpeed: Math.round(data.current.wind_speed),
          windDirection: getWindDirection(data.current.wind_deg),
          feelsLike: Math.round(data.current.feels_like),
          icon: data.current.weather[0].icon,
          sunrise: data.current.sunrise,
          sunset: data.current.sunset
        }
      : {
          temp: Math.round(data.daily[daysFromToday].temp.day),
          condition: data.daily[daysFromToday].weather[0].main,
          description: data.daily[daysFromToday].weather[0].description,
          humidity: data.daily[daysFromToday].humidity,
          windSpeed: Math.round(data.daily[daysFromToday].wind_speed),
          windDirection: getWindDirection(data.daily[daysFromToday].wind_deg),
          feelsLike: Math.round(data.daily[daysFromToday].feels_like.day),
          icon: data.daily[daysFromToday].weather[0].icon,
          sunrise: data.daily[daysFromToday].sunrise,
          sunset: data.daily[daysFromToday].sunset
        }

    // Helper function to convert wind degrees to cardinal direction
    function getWindDirection(degrees: number) {
      const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
      const index = Math.round(degrees / 22.5) % 16
      return directions[index]
    }

    // Get hourly data for the selected day
    const startOfDay = new Date(today)
    startOfDay.setDate(today.getDate() + daysFromToday)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setHours(23, 59, 59, 999)
    
    const startTimestamp = Math.floor(startOfDay.getTime() / 1000)
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000)

    console.log('Time range for hourly data:', {
      daysFromToday,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      startTimestamp,
      endTimestamp
    })

    // Filter hourly data for the selected day
    const hourlyData = data.hourly
      .filter((hour: any) => {
        const hourTimestamp = hour.dt
        return hourTimestamp >= startTimestamp && hourTimestamp <= endTimestamp
      })
      .map((hour: any) => ({
        time: new Date(hour.dt * 1000).getHours(),
        temp: Math.round(hour.temp),
        condition: hour.weather[0].main,
        description: hour.weather[0].description,
        humidity: hour.humidity,
        windSpeed: Math.round(hour.wind_speed),
        windDirection: getWindDirection(hour.wind_deg),
        feelsLike: Math.round(hour.feels_like),
        precipitation: Math.round(hour.pop * 100),
        icon: hour.weather[0].icon
      }))

    const response_data = {
      ...dailyData,
      hourly: hourlyData
    }
    
    console.log('Final response data:', response_data)

    return NextResponse.json(response_data)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch weather data" },
      { status: 500 }
    )
  }
} 