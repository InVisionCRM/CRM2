"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  // After mounting, we have access to the theme
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-700"
        disabled
      >
        <Sun className="h-[18px] w-[18px]" />
        <span className="sr-only">Loading theme</span>
      </Button>
    )
  }

  function toggleTheme() {
    console.log("Current theme:", resolvedTheme)
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
    console.log("Theme toggled to:", resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      <span className="sr-only">{resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}</span>
    </Button>
  )
}
