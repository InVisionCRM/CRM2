"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SignatureCanvasProps {
  value: string
  onChange: (value: string) => void
}

export default function SignatureCanvas({ value, onChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas to be responsive
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set line style
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#000"

    // If there's a saved signature, load it
    if (value) {
      const img = new Image()
      img.crossOrigin = "anonymous" // Add this to prevent CORS issues
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    }
  }, [value])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevent scrolling
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()

    // Get position based on event type
    const { x, y } = getEventPosition(e, canvas)
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevent scrolling
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get position based on event type
    const { x, y } = getEventPosition(e, canvas)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    // Save the signature as data URL
    const dataUrl = canvas.toDataURL("image/png")
    onChange(dataUrl)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange("")
  }

  const getEventPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect()

    if ("touches" in e) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }

  return (
    <div className="space-y-2">
      <Card className="p-1 bg-gray-50">
        <canvas
          ref={canvasRef}
          className="w-full h-32 border border-gray-200 bg-white rounded-sm cursor-crosshair"
          style={{ touchAction: "none" }} // Prevent touch scrolling
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </Card>
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
          Clear
        </Button>
      </div>
    </div>
  )
}
