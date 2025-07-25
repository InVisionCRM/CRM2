"use client"

import { useState, useEffect } from 'react'

interface PWAState {
  isInstalled: boolean
  isOnline: boolean
  canInstall: boolean
  deferredPrompt: any
}

export function usePWA() {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isOnline: true,
    canInstall: false,
    deferredPrompt: null
  })

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInApp = window.navigator.standalone === true
      return isStandalone || isInApp
    }

    // Check online status
    const checkOnlineStatus = () => {
      return navigator.onLine
    }

    // Set initial state
    setPwaState(prev => ({
      ...prev,
      isInstalled: checkIfInstalled(),
      isOnline: checkOnlineStatus()
    }))

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setPwaState(prev => ({
        ...prev,
        canInstall: true,
        deferredPrompt: e
      }))
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        deferredPrompt: null
      }))
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }))
    }

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }))
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const installApp = async () => {
    if (!pwaState.deferredPrompt) return false

    try {
      pwaState.deferredPrompt.prompt()
      const { outcome } = await pwaState.deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setPwaState(prev => ({
          ...prev,
          canInstall: false,
          deferredPrompt: null
        }))
        return true
      } else {
        console.log('User dismissed the install prompt')
        setPwaState(prev => ({
          ...prev,
          canInstall: false,
          deferredPrompt: null
        }))
        return false
      }
    } catch (error) {
      console.error('Error installing app:', error)
      return false
    }
  }

  const dismissInstallPrompt = () => {
    setPwaState(prev => ({
      ...prev,
      canInstall: false,
      deferredPrompt: null
    }))
  }

  return {
    ...pwaState,
    installApp,
    dismissInstallPrompt
  }
} 