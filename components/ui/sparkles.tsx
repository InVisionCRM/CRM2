"use client"
import { useId } from "react"
import { useEffect, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import type { Container, ISourceOptions } from "@tsparticles/engine"
import { loadSlim } from "@tsparticles/slim"
import { cn } from "@/lib/utils"
import { motion, useAnimation } from "framer-motion"

// Helper function for deep merging options (simple version)
// In a real app, consider using a library like lodash.merge
function mergeOptions(baseOptions: ISourceOptions, customOptions?: ISourceOptions): ISourceOptions {
  if (!customOptions) return baseOptions;

  // Basic deep merge for relevant properties
  const merged = { ...baseOptions };

  if (customOptions.particles) {
    merged.particles = { ...(baseOptions.particles || {}), ...customOptions.particles };
    if (customOptions.particles.move) {
      merged.particles.move = { ...(baseOptions.particles?.move || {}), ...customOptions.particles.move };
    }
    if (customOptions.particles.shape) {
      merged.particles.shape = { ...(baseOptions.particles?.shape || {}), ...customOptions.particles.shape };
    }
    if (customOptions.particles.size) {
      merged.particles.size = { ...(baseOptions.particles?.size || {}), ...customOptions.particles.size };
    }
    if (customOptions.particles.opacity) {
      merged.particles.opacity = { ...(baseOptions.particles?.opacity || {}), ...customOptions.particles.opacity };
    }
    // Add more nested properties if needed
  }

  if (customOptions.interactivity) {
    merged.interactivity = { ...(baseOptions.interactivity || {}), ...customOptions.interactivity };
    if (customOptions.interactivity.events) {
      merged.interactivity.events = { ...(baseOptions.interactivity?.events || {}), ...customOptions.interactivity.events };
    }
    // Add more nested properties if needed
  }

  // Merge other top-level properties if provided
  if (customOptions.polygon) {
      merged.polygon = { ...(baseOptions.polygon || {}), ...customOptions.polygon };
  }

  return merged;
}

type ParticlesProps = {
  id?: string
  className?: string
  background?: string
  particleSize?: number
  minSize?: number
  maxSize?: number
  speed?: number
  particleColor?: string
  particleDensity?: number
  options?: ISourceOptions; // <-- Add options prop
}

export const SparklesCore = (props: ParticlesProps) => {
  const { id, className, background, minSize, maxSize, speed, particleColor, particleDensity, options: customOptions } = props // <-- Destructure options
  const [init, setInit] = useState(false)
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])
  const controls = useAnimation()

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      controls.start({
        opacity: 1,
        transition: {
          duration: 1,
        },
      })
    }
  }

  const generatedId = useId()

  // --- Define Base Options --- 
  const baseOptions: ISourceOptions = {
    background: {
      color: {
        value: background || "#000000", // Default background to black if none provided
      },
    },
    fullScreen: {
      enable: false, // Ensure it doesn't take fullscreen
      zIndex: 1,
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: "push",
        },
        onHover: {
          enable: false, // Keep hover off by default
          mode: "repulse",
        },
        resize: true as any,
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: particleColor || "#ffffff",
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "out",
        },
        random: false,
        speed: speed || 1, // Use speed prop or default
        straight: false,
      },
      number: {
        density: {
          enable: true,
          width: 800, // Use area instead of value/width for density
          height: 800,
        },
        value: particleDensity || 80, // Default particle number
      },
      opacity: {
        value: { min: 0.1, max: 0.5 }, // Default opacity range
        animation: {
          enable: true,
          speed: speed || 3, // Use speed prop or default
          sync: false,
          startValue: "random",
        },
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: minSize || 1, max: maxSize || 3 }, // Use size props or defaults
        animation: {
          enable: false, // Keep size animation off by default
        },
      },
    },
    detectRetina: true,
  };
  // --- End Base Options ---

  return (
    <motion.div animate={controls} className={cn("opacity-0", className)}>
      {init && (
        <Particles
          id={id || generatedId}
          className={cn("h-full w-full")}
          particlesLoaded={particlesLoaded}
          options={mergeOptions(baseOptions, customOptions)} // <-- Merge options here
        />
      )}
    </motion.div>
  )
} 