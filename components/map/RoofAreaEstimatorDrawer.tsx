"use client"

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { RoofAreaEstimator } from "./RoofAreaEstimator"
import { Button } from "@/components/ui/button"
import { Ruler } from "lucide-react"

interface RoofAreaEstimatorDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCenter?: { lat: number; lng: number }
}

export function RoofAreaEstimatorDrawer({ open, onOpenChange, initialCenter }: RoofAreaEstimatorDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full h-[95vh] max-w-none p-2 sm:p-4 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-slate-600/50 backdrop-blur-xl shadow-2xl shadow-black/50">
        <DrawerHeader className="pb-2 sm:pb-4">
          <DrawerTitle className="text-lg sm:text-xl">Roof Area Estimator</DrawerTitle>
          <DrawerDescription className="text-sm sm:text-base">
            Use the polygon tool to draw on the map and calculate the roof area in squares.
          </DrawerDescription>
        </DrawerHeader>
        <div className="h-full py-2 px-1 sm:py-4 sm:px-2">
            <RoofAreaEstimator initialCenter={initialCenter} />
        </div>
      </DrawerContent>
    </Drawer>
  )
} 