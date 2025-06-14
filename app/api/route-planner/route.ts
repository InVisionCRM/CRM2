import { NextRequest, NextResponse } from 'next/server'

interface RouteRequest {
  origin: string
  destination: string
  intermediate: string
}

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, intermediate }: RouteRequest = await request.json()

    if (!origin || !destination || !intermediate) {
      return NextResponse.json(
        { error: 'Origin, destination, and intermediate address are required' },
        { status: 400 }
      )
    }

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!googleApiKey) {
      console.error('Google Maps API key not configured')
      return NextResponse.json(
        { error: 'Route planning service is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Prepare the request body for Google Routes API
    const routeRequestBody = {
      origin: { address: origin.trim() },
      destination: { address: destination.trim() },
      intermediates: [{ address: intermediate.trim() }],
      travelMode: "DRIVE",
      optimizeWaypointOrder: true,
      routingPreference: "TRAFFIC_AWARE"
    }

    console.log('Sending route request to Google Routes API:', {
      origin: origin.trim(),
      destination: destination.trim(),
      intermediate: intermediate.trim(),
      optimizeWaypointOrder: true
    })

    // Call Google Routes API
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.duration,routes.distanceMeters,routes.legs,routes.polyline'
      },
      body: JSON.stringify(routeRequestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Routes API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      
      // Provide more specific error messages
      if (response.status === 400) {
        return NextResponse.json(
          { error: 'Invalid addresses provided. Please check your addresses and try again.' },
          { status: 400 }
        )
      } else if (response.status === 403) {
        return NextResponse.json(
          { error: 'Route planning service access denied. Please contact support.' },
          { status: 500 }
        )
      } else {
        return NextResponse.json(
          { error: 'Failed to compute route. Please try again or contact support.' },
          { status: 500 }
        )
      }
    }

    const data = await response.json()
    console.log('Google Routes API response:', JSON.stringify(data, null, 2))
    
    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json(
        { error: 'No routes found for the given addresses. Please verify your addresses are correct.' },
        { status: 404 }
      )
    }

    const route = data.routes[0]
    
    // Calculate total distance and duration
    const totalDistance = route.distanceMeters 
      ? `${(route.distanceMeters / 1000).toFixed(1)} km`
      : 'Unknown'
    
    const totalDuration = route.duration
      ? formatDuration(route.duration)
      : 'Unknown'

    // Get optimized waypoint order
    // When optimizeWaypointOrder is true, the API returns the optimized order
    // The order array represents the order in which to visit the intermediate waypoints
    // For a simple 3-point route (origin -> intermediate -> destination):
    // - If optimization suggests going origin -> intermediate -> destination: [0]
    // - The response shows which intermediate waypoints to visit in order
    let optimizedOrder = [0, 1, 2] // Default order: start, middle, end
    
    if (route.optimizedIntermediateWaypointIndex && route.optimizedIntermediateWaypointIndex.length > 0) {
      // Google's response gives us the optimized order of intermediate waypoints
      // For our 3-point route, we build the full route order
      optimizedOrder = [0, ...route.optimizedIntermediateWaypointIndex.map((i: number) => i + 1), 2]
    }

    console.log('Route optimization result:', {
      originalOrder: [0, 1, 2],
      optimizedOrder,
      totalDistance,
      totalDuration
    })

    const result = {
      optimizedOrder,
      totalDistance,
      totalDuration,
      routes: data.routes,
      // Include additional details for potential future use
      legs: route.legs || [],
      polyline: route.polyline || null
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Route planning error:', error)
    
    // Provide user-friendly error messages
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format. Please try again.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}

function formatDuration(duration: string): string {
  // Duration comes in format like "1234s"
  const seconds = parseInt(duration.replace('s', ''))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
} 