"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"

export function DateDebug() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null)

  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  if (!currentDate) return null

  return (
    <div className="text-xs text-gray-500 mb-2">
      <p>
        Today is {format(currentDate, "EEEE, MMMM d, yyyy")} (Local time: {format(currentDate, "h:mm:ss a")})
      </p>
      <p>Browser timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
    </div>
  )
}
