import { NextRequest, NextResponse } from 'next/server'

interface PlacesAutocompleteRequest {
  input: string
  sessionToken?: string
}

export async function POST(request: NextRequest) {
  try {
    const { input }: PlacesAutocompleteRequest = await request.json()

    if (!input || input.length < 2) {
      return NextResponse.json(
        { error: 'Input must be at least 2 characters' },
        { status: 400 }
      )
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    // Build the Google Places Autocomplete API URL
    const params = new URLSearchParams({
      input: input.trim(),
      key: googleApiKey,
      types: 'address',
      language: 'en',
      components: 'country:us', // Restrict to US addresses - adjust as needed
    })

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Places API Error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch address suggestions' },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Check for API errors
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API Status:', data.status, data.error_message)
      return NextResponse.json(
        { error: `Places API error: ${data.status}` },
        { status: 500 }
      )
    }

    // Return the predictions
    return NextResponse.json({
      predictions: data.predictions || [],
      status: data.status
    })

  } catch (error) {
    console.error('Places autocomplete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 