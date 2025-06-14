import { NextRequest, NextResponse } from 'next/server'

interface ReverseGeocodeRequest {
  lat: number
  lng: number
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng }: ReverseGeocodeRequest = await request.json()

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!googleApiKey) {
      console.error('Google Maps API key not configured')
      return NextResponse.json(
        { error: 'Geocoding service is not configured' },
        { status: 500 }
      )
    }

    // Call Google Geocoding API for reverse geocoding
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('Google Geocoding API Error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to reverse geocode location' },
        { status: 500 }
      )
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding failed:', data.status, data.error_message)
      return NextResponse.json(
        { error: 'No address found for the given coordinates' },
        { status: 404 }
      )
    }

    // Get the most relevant address (usually the first result)
    const address = data.results[0]?.formatted_address || `${lat}, ${lng}`

    return NextResponse.json({ address })

  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during reverse geocoding' },
      { status: 500 }
    )
  }
} 