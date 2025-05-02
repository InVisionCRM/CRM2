"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    // Create gradient points
    let gradientPoints: { x: number; y: number; vx: number; vy: number; color: string }[] = []
    const colors = ["#59ff0022", "#00ff8822", "#59ff0011"]
    
    for (let i = 0; i < 5; i++) {
      gradientPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return

      // Clear canvas with a semi-transparent black
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw gradient points
      gradientPoints.forEach(point => {
        // Update position
        point.x += point.vx
        point.y += point.vy

        // Bounce off edges
        if (point.x <= 0 || point.x >= canvas.width) point.vx *= -1
        if (point.y <= 0 || point.y >= canvas.height) point.vy *= -1

        // Draw gradient
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, 200
        )
        gradient.addColorStop(0, point.color)
        gradient.addColorStop(1, "transparent")

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed top-0 left-0 w-full h-full -z-10",
        "opacity-40 pointer-events-none",
        "mix-blend-screen"
      )}
    />
  )
} 