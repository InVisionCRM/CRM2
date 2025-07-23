"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUp, User, CheckCircle, FileText, MessageSquare } from "lucide-react"

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

interface GlobalStatsData {
  totalLeads: number
  totalJobsCompleted: number
  totalContractsSigned: number
  totalNotesLeft: number
  lastLeadEntered: string
}

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
  <div className="flex items-center space-x-2 sm:space-x-4">
    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
    <div>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{title}</p>
      <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  </div>
)

export function SimpleGlobalStats() {
  const [isPWA, setIsPWA] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Debug logging for PWA issues
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsPWA(isStandalone)
    setIsOnline(navigator.onLine)
    
    console.log('SimpleGlobalStats: Component mounted')
    console.log('SimpleGlobalStats: PWA mode:', isStandalone)
    console.log('SimpleGlobalStats: Service worker available:', 'serviceWorker' in navigator)
    console.log('SimpleGlobalStats: Online status:', navigator.onLine)
    
    if (isStandalone) {
      console.log('SimpleGlobalStats: Running in PWA standalone mode')
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      console.log('SimpleGlobalStats: Back online')
    }
    const handleOffline = () => {
      setIsOnline(false)
      console.log('SimpleGlobalStats: Gone offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const { data, error, isLoading } = useSWR<GlobalStatsData>("/api/stats/global", fetcher, {
    refreshInterval: isPWA ? 120000 : 60000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    retryCount: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('SimpleGlobalStats: Error fetching global stats:', error)
    },
    onSuccess: (data) => {
      console.log('SimpleGlobalStats: Successfully fetched global stats:', data)
    }
  })

  if (isLoading) {
    return (
      <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Simple Global Stats (Loading...)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full pb-6 sm:pb-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading stats...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    console.error('SimpleGlobalStats: Failed to load stats. Error:', error)
    return (
      <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Simple Global Stats (Error)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full pb-6 sm:pb-8">
          <div className="text-center">
            <p className="text-destructive mb-2">Failed to load stats.</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {error?.message || 'Please check your connection and try again.'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const {
    totalLeads,
    totalJobsCompleted,
    totalContractsSigned,
    totalNotesLeft,
  } = data

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* PWA Status Indicator (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-green-100 dark:bg-green-900 rounded text-xs">
          <strong>SimpleGlobalStats Debug:</strong> 
          {isPWA ? ' Running in PWA mode' : ' Running in browser mode'} | 
          Service Worker: {'serviceWorker' in navigator ? 'Available' : 'Not available'} |
          Network: {isOnline ? 'Online' : 'Offline'}
        </div>
      )}
      
      <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Simple Global Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 h-full pb-6 sm:pb-8">
          <StatCard title="Total Leads" value={totalLeads} icon={User} />
          <StatCard title="Jobs Completed" value={totalJobsCompleted} icon={CheckCircle} />
          <StatCard title="Contracts Signed" value={totalContractsSigned} icon={FileText} />
          <StatCard title="Notes Left" value={totalNotesLeft} icon={MessageSquare} />
        </CardContent>
      </Card>
    </div>
  )
} 