"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"

interface WeatherRadarDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function WeatherRadarDialog({ isOpen, onClose }: WeatherRadarDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-black/95 to-black/90 border-white/20 text-white max-w-5xl p-0 gap-0">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-lg font-medium">Live Weather Radar</span>
        </div>
        <div className="w-full">
          <iframe 
            src="https://www.rainviewer.com/map.html?loc=42.4753,-83.0967,7.81627744731677&oCS=1&oAP=1&c=3&o=83&lm=1&layer=radar&sm=1&sn=1&ts=1" 
            width="100%" 
            height="500px"
            frameBorder="0" 
            style={{ border: 0 }} 
            allowFullScreen 
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 