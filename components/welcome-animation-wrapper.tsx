"use client"

import { useState, useEffect } from "react"
import { WelcomeAnimation } from "@/components/welcome-animation"

export function WelcomeAnimationWrapper() {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    // Check if this is the first visit to the calendar page in this session
    const hasVisitedCalendar = sessionStorage.getItem("hasVisitedCalendar")

    if (!hasVisitedCalendar) {
      setShowAnimation(true)
      sessionStorage.setItem("hasVisitedCalendar", "true")
    }
  }, [])

  if (!showAnimation) {
    return null
  }

  return <WelcomeAnimation />
}
