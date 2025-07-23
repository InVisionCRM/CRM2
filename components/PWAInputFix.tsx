'use client'

import { usePWAInputFix } from '@/hooks/usePWAInputFix'

export function PWAInputFix() {
  const { isPWA, isIOS } = usePWAInputFix()

  // This component doesn't render anything, it just applies fixes
  return null
} 