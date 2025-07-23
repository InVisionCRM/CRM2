'use client'

import { useState, useEffect } from 'react'
import { GlobalStats } from '@/components/dashboard/global-stats'
import { SimpleGlobalStats } from '@/components/dashboard/simple-global-stats'
import { GlobalStatsNoAuto } from '@/components/dashboard/global-stats-no-auto'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestGlobalStatsPage() {
  const [isPWA, setIsPWA] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewportInfo, setViewportInfo] = useState({
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    clientWidth: 0,
    clientHeight: 0
  })
  const [showGlobalStats, setShowGlobalStats] = useState(true)
  const [showSimpleGlobalStats, setShowSimpleGlobalStats] = useState(true)
  const [showGlobalStatsNoAuto, setShowGlobalStatsNoAuto] = useState(true)

  useEffect(() => {
    // Check PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsPWA(isStandalone)

    // Check if mobile
    const isMobileDevice = window.innerWidth < 768
    setIsMobile(isMobileDevice)

    // Get viewport information
    const updateViewportInfo = () => {
      setViewportInfo({
        width: window.screen.width,
        height: window.screen.height,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight
      })
    }

    updateViewportInfo()
    window.addEventListener('resize', updateViewportInfo)

    return () => window.removeEventListener('resize', updateViewportInfo)
  }, [])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GlobalStats Mobile PWA Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Environment</h3>
              <div className="space-y-1 text-sm">
                <div><Badge variant={isPWA ? "default" : "secondary"}>
                  {isPWA ? 'PWA Mode' : 'Browser Mode'}
                </Badge></div>
                <div><Badge variant={isMobile ? "default" : "secondary"}>
                  {isMobile ? 'Mobile' : 'Desktop'}
                </Badge></div>
                <div>User Agent: <span className="text-xs break-all">{navigator.userAgent}</span></div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Viewport Information</h3>
              <div className="space-y-1 text-sm">
                <div>Screen: {viewportInfo.width} × {viewportInfo.height}</div>
                <div>Window: {viewportInfo.innerWidth} × {viewportInfo.innerHeight}</div>
                <div>Client: {viewportInfo.clientWidth} × {viewportInfo.clientHeight}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setShowGlobalStats(!showGlobalStats)}
              variant="outline"
            >
              {showGlobalStats ? 'Hide' : 'Show'} GlobalStats
            </Button>
            <Button 
              onClick={() => setShowSimpleGlobalStats(!showSimpleGlobalStats)}
              variant="outline"
            >
              {showSimpleGlobalStats ? 'Hide' : 'Show'} SimpleGlobalStats
            </Button>
            <Button 
              onClick={() => setShowGlobalStatsNoAuto(!showGlobalStatsNoAuto)}
              variant="outline"
            >
              {showGlobalStatsNoAuto ? 'Hide' : 'Show'} GlobalStatsNoAuto
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {showGlobalStats && (
        <Card>
          <CardHeader>
            <CardTitle>GlobalStats Component Test (Original)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-blue-300 p-4 rounded-lg">
              <GlobalStats />
            </div>
          </CardContent>
        </Card>
      )}

      {showSimpleGlobalStats && (
        <Card>
          <CardHeader>
            <CardTitle>SimpleGlobalStats Component Test (Simplified)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-green-300 p-4 rounded-lg">
              <SimpleGlobalStats />
            </div>
          </CardContent>
        </Card>
      )}

      {showGlobalStatsNoAuto && (
        <Card>
          <CardHeader>
            <CardTitle>GlobalStatsNoAuto Component Test (No Auto-Rotation)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-orange-300 p-4 rounded-lg">
              <GlobalStatsNoAuto />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Simple Test Component</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Test Card</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is a simple test card with the same height as GlobalStats
              </p>
              <div className="mt-4 text-xs text-gray-500">
                Height: 350px (mobile) / 400px (desktop)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Console Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>Open browser console to see GlobalStats debug logs:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>"GlobalStats: Component mounted"</li>
              <li>"GlobalStats: PWA mode: true/false"</li>
              <li>"GlobalStats: Service worker available: true/false"</li>
              <li>"GlobalStats: Online status: true/false"</li>
              <li>"GlobalStats: Successfully fetched global stats: [data]"</li>
              <li>"GlobalStats: Error fetching global stats: [error]"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 