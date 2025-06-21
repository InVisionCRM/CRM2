"use client"

import { WavyBackground } from "@/components/ui/wavy-background"

export const FixedWavyBackground = () => {
  return (
    <div className="fixed-wavy-background">
      <WavyBackground 
        className="w-full h-full"
        containerClassName="w-full h-full"
        colors={["#59ff00", "#38bdf8", "#818cf8"]}
        waveWidth={25}
        backgroundFill="rgba(0, 0, 0, 0.5)"
        blur={5}
        speed="fast"
        waveOpacity={0.2}
      />
    </div>
  )
} 