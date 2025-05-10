"use client"

import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"

export default function TestBackgroundPage() {
  return (
    <div className="min-h-screen">
      <BackgroundGradientAnimation
        containerClassName="min-h-screen"
        gradientBackgroundStart="rgb(25, 25, 77)"
        gradientBackgroundEnd="rgb(9, 9, 34)"
        firstColor="18, 113, 255"
        secondColor="221, 74, 255"
        thirdColor="100, 220, 255"
        fourthColor="200, 50, 50"
        fifthColor="180, 180, 50"
        interactive={true}
        size="100%"
        blendingValue="screen"
      >
        <div className="flex flex-col items-center justify-center min-h-screen text-white">
          <h1 className="text-4xl font-bold mb-4">Background Animation Test</h1>
          <p className="text-xl">Move your mouse around to see the interactive effect</p>
        </div>
      </BackgroundGradientAnimation>
    </div>
  )
}
