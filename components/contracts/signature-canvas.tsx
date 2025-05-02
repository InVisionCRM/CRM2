"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SignatureCanvasProps {
  value: string
  onChange: (dataUrl: string) => void
  className?: string
}

export function SignatureCanvas({ value, onChange, className }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set line style
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000"

    // Load existing signature if available
    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    }

    const handleResize = () => {
      if (!canvas) return

      // Save current drawing
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext("2d")
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0)
      }

      // Resize canvas
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Restore drawing
      if (ctx) {
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.strokeStyle = "#000"
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [value])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    // Get coordinates
    let x, y
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get coordinates
    let x, y
    if ("touches" in e) {
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(false)

    // Save signature as data URL
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

  return (
    <div className="space-y-2">
      <div className={cn("border rounded-md p-1 relative", className)}>
        <canvas
          ref={canvasRef}
          className="w-full h-32 cursor-crosshair touch-none bg-gray-100"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        <Button
          type="button"
          size="sm"
          className="absolute bottom-2 right-2 bg-white hover:bg-gray-100 text-black border border-gray-200 shadow-sm"
          onClick={clearSignature}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Sign above using mouse or touch</p>
    </div>
  )
}
