'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed or in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const isInstalled = (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://') ||
                        standalone

    setIsStandalone(standalone)
    setIsInstalled(isInstalled)

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    
    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show install prompt after a delay if not dismissed before
      setTimeout(() => {
        const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed')
        const installCount = localStorage.getItem('pwa-install-prompt-count') || '0'
        
        if (!hasBeenDismissed && parseInt(installCount) < 3 && !isInstalled) {
          setShowInstallPrompt(true)
          localStorage.setItem('pwa-install-prompt-count', (parseInt(installCount) + 1).toString())
        }
      }, 5000) // Show after 5 seconds
    }

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check for iOS Safari specific install prompt
    if (isIOSDevice && !isInstalled && !standalone) {
      const hasSeenIOSPrompt = localStorage.getItem('ios-install-seen')
      if (!hasSeenIOSPrompt) {
        setTimeout(() => {
          setShowIOSInstructions(true)
        }, 10000) // Show after 10 seconds on iOS
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-install-accepted', 'true')
      } else {
        localStorage.setItem('pwa-install-dismissed', 'true')
      }
      
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleIOSDismiss = () => {
    setShowIOSInstructions(false)
    localStorage.setItem('ios-install-seen', 'true')
  }

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone) {
    return null
  }

  return (
    <>
      {/* Android/Desktop Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 z-[70] md:left-auto md:right-4 md:w-96"
          >
            <Card className="bg-background border-border shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Download className="w-6 h-6 text-black
                    " />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      Install Roofing CRM
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add to your home screen for quick access and offline use
                    </p>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button
                        onClick={handleInstallClick}
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Install
                      </Button>
                      <Button
                        onClick={handleDismiss}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        Not now
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto w-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Install Instructions */}
      <AnimatePresence>
        {showIOSInstructions && isIOS && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 z-[70]"
          >
            <Card className="bg-background border-border shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      Add to Home Screen
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tap the share button <span className="font-mono">⎋</span> in Safari, then select "Add to Home Screen"
                    </p>
                    <div className="flex items-center space-x-3 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-lg">⎋</span>
                        <span>Share</span>
                      </div>
                      <span>→</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-lg">+</span>
                        <span>Add to Home Screen</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleIOSDismiss}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs mt-2"
                    >
                      Got it
                    </Button>
                  </div>
                  <Button
                    onClick={handleIOSDismiss}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto w-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 