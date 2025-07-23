import { useEffect, useRef } from 'react'

export function usePWAInputFix() {
  const isPWA = useRef(false)
  const isIOS = useRef(false)

  useEffect(() => {
    // Check if running in PWA mode
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInApp = window.navigator.standalone === true
      isPWA.current = isStandalone || isInApp
      
      // Check if iOS
      isIOS.current = /iPad|iPhone|iPod/.test(navigator.userAgent)
    }

    checkPWA()

    // Fix for iOS PWA input issues
    if (isPWA.current && isIOS.current) {
      // Prevent zoom on input focus
      const preventZoom = (e: Event) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          // Ensure font size is at least 16px to prevent zoom
          if (parseFloat(getComputedStyle(target).fontSize) < 16) {
            target.style.fontSize = '16px'
          }
        }
      }

      // Fix viewport issues on iOS
      const fixViewport = () => {
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
        }
      }

      // Apply fixes
      document.addEventListener('focusin', preventZoom)
      fixViewport()

      // Cleanup
      return () => {
        document.removeEventListener('focusin', preventZoom)
      }
    }
  }, [])

  return {
    isPWA: isPWA.current,
    isIOS: isIOS.current,
  }
} 