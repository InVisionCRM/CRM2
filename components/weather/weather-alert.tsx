"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { formatDate, formatTime } from "@/lib/weather"
import type { WeatherAlert } from "@/types/weather"

interface WeatherAlertProps {
  alert: WeatherAlert
}

export function WeatherAlertComponent({ alert }: WeatherAlertProps) {
  const startTime = formatTime(alert.start)
  const endTime = formatTime(alert.end)
  const startDate = formatDate(alert.start)
  const endDate = formatDate(alert.end)

  const timeDisplay =
    startDate === endDate
      ? `${startDate}, ${startTime} - ${endTime}`
      : `${startDate} ${startTime} - ${endDate} ${endTime}`

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{alert.event}</AlertTitle>
      <AlertDescription>
        <p className="text-xs mt-1">{timeDisplay}</p>
        <p className="text-sm mt-2">{alert.description}</p>
        <p className="text-xs mt-2 text-muted-foreground">Source: {alert.sender_name}</p>
      </AlertDescription>
    </Alert>
  )
}
