import { NextResponse } from "next/server"

// In a real app, this would be in an environment variable
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "YOUR_API_KEY"
const API_BASE_URL = "https://api.openweathermap.org/data/3.0/onecall"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Call OpenWeather One Call API 3.0
    // Note: This API requires a separate "One Call by Call" subscription
    const response = await fetch(
      `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial&exclude=minutely,hourly,alerts`
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenWeather API error:", errorText)
      
      // Check for specific error cases
      if (response.status === 401) {
        throw new Error("Invalid API key or unauthorized access to One Call API 3.0")
      } else if (response.status === 429) {
        throw new Error("API call limit exceeded for One Call API 3.0")
      }
      
      throw new Error(`Failed to fetch weather data: ${errorText}`)
    }

    const data = await response.json()

    // Validate the response has the expected structure
    if (!data.daily || !Array.isArray(data.daily)) {
      throw new Error("Invalid response format from OpenWeather API")
    }

    // Return the full data so we can access daily forecasts
    return NextResponse.json(data)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch weather data" },
      { status: 500 }
    )
  }
} 