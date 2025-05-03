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

export function DockThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = React.useState(false)

  // After mounting, we have access to the theme
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  function toggleTheme(e: React.MouseEvent) {
    e.preventDefault()
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center w-full h-full opacity-70">
        <Moon className="h-10 w-10 text-gray-400" />
      </div>
    )
  }

  return (
    <div 
      className="flex items-center justify-center w-full h-full cursor-pointer" 
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
        }
      }}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-12 w-12 text-amber-400" />
      ) : (
        <Moon className="h-12 w-12 text-indigo-600" />
      )}
    </div>
  )
}
