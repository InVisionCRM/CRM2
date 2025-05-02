"use client"

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SparklesCore } from "@/components/ui/sparkles"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export const Hero = () => {
  const logoRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = React.useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const opacity = Math.max(1 - scrollY / 200, 0)

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
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ opacity }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="h-[40rem] w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md relative"
    >
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-8 w-full max-w-xl px-4 z-50"
      >
        <div className="relative w-full">
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 h-12 bg-black/50 border-white/20 text-white placeholder-white/50 rounded-full backdrop-blur-sm focus:border-white/50 focus:ring-0 font-extralight"
          />
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
        </div>
      </motion.div>

      {/* Logo in the background with shadow play effect */}
      <motion.div
        ref={logoRef}
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 0.2 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
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
      </motion.div>

      {/* Main content */}
      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="text-6xl md:text-7xl lg:text-9xl font-bold text-center relative z-20"
      >
        <span className="text-white">PURL</span>
        <span style={{ color: "#59ff00" }} className="drop-shadow-[0_0_8px_rgba(89,255,0,0.8)]">
          IN
        </span>
      </motion.h1>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        className="w-[40rem] lg:h-40 h-60 relative"
      >
        {/* Gradients */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
          className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-[2px] w-3/4 blur-sm" 
        />
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
          className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-px w-3/4" 
        />
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-[5px] w-1/4 blur-sm" 
        />
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-[#59ff00] to-transparent h-px w-1/4" 
        />

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
      </motion.div>
    </motion.div>
  )
} 