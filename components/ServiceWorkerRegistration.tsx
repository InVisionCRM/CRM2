'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isUpdateReady, setIsUpdateReady] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [swStatus, setSwStatus] = useState<'installing' | 'installed' | 'error' | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })

      setRegistration(reg)
      console.log('Service Worker registered successfully:', reg)

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          setSwStatus('installing')
          console.log('New service worker installing...')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Update available
                setUpdateAvailable(true)
                setSwStatus('installed')
                console.log('New service worker installed, update available')
              } else {
                // First install
                setSwStatus('installed')
                console.log('Service worker installed for the first time')
              }
            }
          })
        }
      })

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated')
        setIsUpdateReady(true)
        setUpdateAvailable(false)
      })

      // Check for updates periodically
      setInterval(() => {
        reg.update()
      }, 60000) // Check every minute

    } catch (error) {
      console.error('Service Worker registration failed:', error)
      setSwStatus('error')
    }
  }

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return

    setIsUpdating(true)

    try {
      // Send message to waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      // Listen for the controlling service worker to change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    } catch (error) {
      console.error('Failed to update service worker:', error)
      setIsUpdating(false)
    }
  }

  const dismissUpdate = () => {
    setUpdateAvailable(false)
  }

  return (
    <>
      {/* Update Available Notification */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
          >
            <Card className="bg-background border-border shadow-lg border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Download className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      Update Available
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      A new version of the app is ready to install with improvements and bug fixes.
                    </p>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Update Now
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={dismissUpdate}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        disabled={isUpdating}
                      >
                        Later
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Ready Notification */}
      <AnimatePresence>
        {isUpdateReady && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
          >
            <Card className="bg-background border-border shadow-lg border-green-500">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      App Updated
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      The app has been updated successfully with the latest features.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsUpdateReady(false)}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto w-auto"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Worker Status Indicator (Development) */}
      {process.env.NODE_ENV === 'development' && swStatus && (
        <div className="fixed bottom-4 left-4 z-30">
          <div className={`
            px-2 py-1 rounded text-xs font-mono
            ${swStatus === 'installing' ? 'bg-yellow-500 text-yellow-900' : ''}
            ${swStatus === 'installed' ? 'bg-green-500 text-green-900' : ''}
            ${swStatus === 'error' ? 'bg-red-500 text-red-900' : ''}
          `}>
            SW: {swStatus}
          </div>
        </div>
      )}
    </>
  )
} 