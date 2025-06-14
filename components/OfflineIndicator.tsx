'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [showBackOnlineMessage, setShowBackOnlineMessage] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [pendingSync, setPendingSync] = useState(0)

  useEffect(() => {
    // Initialize online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
      
      // Show back online message briefly
      setShowBackOnlineMessage(true)
      setTimeout(() => {
        setShowBackOnlineMessage(false)
      }, 3000)

      // Trigger sync when back online
      handleSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check for pending sync data
    const checkPendingSync = () => {
      const pending = localStorage.getItem('pwa-pending-sync')
      if (pending) {
        setPendingSync(JSON.parse(pending).length || 0)
      }
    }

    checkPendingSync()
    
    // Check sync status periodically
    const syncInterval = setInterval(checkPendingSync, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(syncInterval)
    }
  }, [])

  const handleSync = async () => {
    if (!isOnline) return

    try {
      // Simulate sync process
      const pendingData = localStorage.getItem('pwa-pending-sync')
      if (pendingData) {
        const pending = JSON.parse(pendingData)
        
        // Here you would normally sync with your API
        // For demo purposes, we'll just clear the pending data
        console.log('Syncing pending data:', pending)
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        localStorage.removeItem('pwa-pending-sync')
        setPendingSync(0)
        setLastSync(new Date())
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  const handleDismissOffline = () => {
    setShowOfflineMessage(false)
  }

  const formatLastSync = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Network Status Indicator */}
      <div className="fixed top-4 right-4 z-40">
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <Badge variant="destructive" className="flex items-center space-x-1">
                <WifiOff className="w-3 h-3" />
                <span className="text-xs">Offline</span>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pendingSync > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mt-2"
            >
              <Badge variant="secondary" className="flex items-center space-x-1">
                <CloudOff className="w-3 h-3" />
                <span className="text-xs">{pendingSync} pending</span>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Offline Message */}
      <AnimatePresence>
        {showOfflineMessage && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
          >
            <Card className="bg-background border-border shadow-lg border-destructive">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-destructive rounded-lg flex items-center justify-center">
                      <WifiOff className="w-5 h-5 text-destructive-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      You're offline
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can still use the app. Changes will sync when you're back online.
                    </p>
                    {lastSync && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last sync: {formatLastSync(lastSync)}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleDismissOffline}
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

      {/* Back Online Message */}
      <AnimatePresence>
        {showBackOnlineMessage && (
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
                      Back online
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pendingSync > 0 ? 'Syncing your changes...' : 'All changes are up to date'}
                    </p>
                  </div>
                  {pendingSync > 0 && (
                    <div className="flex-shrink-0">
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Button (for manual sync when online) */}
      {isOnline && pendingSync > 0 && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            onClick={handleSync}
            size="sm"
            className="shadow-lg"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Sync {pendingSync} items
          </Button>
        </div>
      )}
    </>
  )
} 