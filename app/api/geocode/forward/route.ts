import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { address } = await request.json()

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return NextResponse.json({ lat: location.lat, lng: location.lng })
    } else {
      return NextResponse.json(
        { error: 'Geocoding failed', details: data.status },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Geocoding API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 