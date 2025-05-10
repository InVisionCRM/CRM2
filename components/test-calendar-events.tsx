"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function TestCalendarEvents() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    if (!session?.accessToken) {
      setError("No access token available")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const now = new Date()
      const params = new URLSearchParams({
        maxResults: "10",
        singleEvents: "true",
        orderBy: "startTime",
        timeMin: now.toISOString(),
      })

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      setEvents(data.items || [])
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Test Calendar Events</h2>
        <Button onClick={fetchEvents} disabled={isLoading} size="sm">
          {isLoading ? "Loading..." : "Fetch Events"}
        </Button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}

      {events.length > 0 ? (
        <div>
          <p className="mb-2 text-sm text-gray-500">Found {events.length} events:</p>
          <ul className="space-y-2">
            {events.map((event, index) => (
              <li key={index} className="text-sm p-2 border rounded">
                <div className="font-medium">{event.summary || "Untitled Event"}</div>
                <div className="text-xs text-gray-500">
                  {event.start?.dateTime
                    ? new Date(event.start.dateTime).toLocaleString()
                    : event.start?.date
                      ? new Date(event.start.date).toLocaleDateString()
                      : "No date"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {isLoading ? "Loading events..." : "No events fetched yet. Click the button above to fetch events."}
        </p>
      )}
    </div>
  )
}
