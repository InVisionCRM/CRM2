"use client"

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SparklesCore } from "@/components/ui/sparkles"
import Image from "next/image"

export const Hero = () => {
  const logoRef = useRef<HTMLDivElement>(null)

  // Effect to create the dynamic shadow/light effect on the logo
  useEffect(() => {
    if (!logoRef.current) return

    // This creates a subtle movement of the "light" on the logo
    const handleMouseMove = (e: MouseEvent) => {
      if (!logoRef.current) return

      const { clientX, clientY } = e
      const rect = logoRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      // Update the radial gradient position based on mouse movement
      // This creates the effect of light moving across the logo
      logoRef.current.style.setProperty("--x", `${x}px`)
      logoRef.current.style.setProperty("--y", `${y}px`)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="h-[40rem] w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md relative">
      {/* Logo in the background with shadow play effect */}
      <div
        ref={logoRef}
        className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none"
        style={{
          // This creates the base shadow effect
          maskImage: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), black 10%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), black 10%, transparent 65%)",
        }}
      >
        <div className="relative w-[500px] h-[300px] transform scale-150">
          <Image
            src="/logo.png"
            alt="Purlin Logo"
            fill
            className="object-contain"
            style={{
              filter: "drop-shadow(0 0 15px rgba(190, 242, 100, 0.5))",
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <h1 className="md:text-7xl text-3xl lg:text-9xl font-bold text-center relative z-20">
        <span className="text-white">PURL</span>
        <span style={{ color: "#59ff00" }} className="drop-shadow-[0_0_8px_rgba(89,255,0,0.8)]">
          IN
        </span>
      </h1>
      <div className="w-[40rem] h-40 relative">
        {/* Gradients */}
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-[2px] w-3/4 blur-sm" />
        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-px w-3/4" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-[5px] w-1/4 blur-sm" />
        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-px w-1/4" />

        {/* Core component */}
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#59ff00"
        />

        {/* Radial Gradient to prevent sharp edges */}
        <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
      </div>
    </div>
  )
} 