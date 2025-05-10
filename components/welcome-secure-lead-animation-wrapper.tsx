"use client"

import { useEffect, useState } from "react"
import { WelcomeSecureLeadAnimation } from "@/components/welcome-secure-lead-animation"

/** 
 * Show the animation only the first time a user lands on /leads/[id] 
 * (or whichever route you mount this in) during the current session.
 */
export function WelcomeSecureLeadAnimationWrapper() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const visited = sessionStorage.getItem("hasVisitedSecureLead")
    if (!visited) {
      setShow(true)
      sessionStorage.setItem("hasVisitedSecureLead", "true")
    }
  }, [])

  if (!show) return null
  return <WelcomeSecureLeadAnimation />
}
