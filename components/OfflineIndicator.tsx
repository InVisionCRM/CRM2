"use client"

import { Badge } from '@/components/ui/badge'
import { WifiOff } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <Badge variant="destructive" className="flex items-center gap-2">
        <WifiOff className="h-3 w-3" />
        Offline
              </Badge>
        </div>
  )
} 