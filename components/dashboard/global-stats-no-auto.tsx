"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, FileText, CheckCircle, MessageSquare, Clock, User, Award, BarChart3, Activity, MapPin, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, CloudFog } from "lucide-react"
import { cn } from "@/lib/utils"
import { LeadStatus } from "@prisma/client"

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

interface TopUser {
  id: string
  name: string
  avatar: string
  leadCount: number
}

interface GlobalStatsData {
  totalLeads: number
  totalJobsCompleted: number
  totalContractsSigned: number
  totalNotesLeft: number
  lastLeadEntered: string
  topUsers: TopUser[]
}

interface StatusCountData {
  statusCounts: Array<{
    status: LeadStatus
    count: number
    label: string
  }>
}

interface LastActivityData {
  timeAgo: string
  lastActivity: {
    title: string
    type: string
    userName?: string
    createdAt: string
  } | null
}

interface ZipCodeHeatMapData {
  topZipCodes: Array<{
    zipCode: string
    count: number
    rank: number
    percentage: number
  }>
  totalLeads: number
}

interface WeatherDay {
  dayAbbr: string
  monthAbbr: string
  dayOfMonth: number
  temp: number
  condition: string
  icon: string
}

interface WeatherData {
  daily: Array<{
    temp: {
      day: number
    }
    weather: Array<{
      main: string
      icon: string
    }>
  }>
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

const LoadingSkeleton = () => (
  <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
    <CardHeader className="pb-2 sm:pb-4">
      <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Global Stats (No Auto-Rotation)
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

const getStatusColor = (status: LeadStatus): string => {
  switch (status) {
    case LeadStatus.new_lead:
      return "bg-blue-500"
    case LeadStatus.contacted:
      return "bg-yellow-500"
    case LeadStatus.appointment_scheduled:
      return "bg-purple-500"
    case LeadStatus.signed_contract:
      return "bg-green-500"
    case LeadStatus.completed_jobs:
      return "bg-emerald-500"
    case LeadStatus.lost:
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const getIconForCondition = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'clear':
      return <Sun className="h-6 w-6 text-yellow-500" />
    case 'clouds':
      return <Cloud className="h-6 w-6 text-gray-500" />
    case 'rain':
      return <CloudRain className="h-6 w-6 text-blue-500" />
    case 'snow':
      return <CloudSnow className="h-6 w-6 text-blue-300" />
    case 'thunderstorm':
      return <CloudLightning className="h-6 w-6 text-purple-500" />
    case 'drizzle':
      return <CloudDrizzle className="h-6 w-6 text-blue-400" />
    case 'mist':
    case 'fog':
      return <CloudFog className="h-6 w-6 text-gray-400" />
    default:
      return <Cloud className="h-6 w-6 text-gray-500" />
  }
}

const formatTemperature = (temp: number) => `${Math.round(temp)}°F`

export function GlobalStatsNoAuto() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [isPWA, setIsPWA] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  // Debug logging for PWA issues
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsPWA(isStandalone)
    setIsOnline(navigator.onLine)
    
    console.log('GlobalStatsNoAuto: Component mounted')
    console.log('GlobalStatsNoAuto: PWA mode:', isStandalone)
    console.log('GlobalStatsNoAuto: Service worker available:', 'serviceWorker' in navigator)
    console.log('GlobalStatsNoAuto: Online status:', navigator.onLine)
    
    if (isStandalone) {
      console.log('GlobalStatsNoAuto: Running in PWA standalone mode')
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      console.log('GlobalStatsNoAuto: Back online')
    }
    const handleOffline = () => {
      setIsOnline(false)
      console.log('GlobalStatsNoAuto: Gone offline')
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
      console.error('GlobalStatsNoAuto: Error fetching global stats:', error)
    },
    onSuccess: (data) => {
      console.log('GlobalStatsNoAuto: Successfully fetched global stats:', data)
    }
  })

  const { data: statusData } = useSWR<StatusCountData>("/api/stats/lead-status-counts", fetcher, {
    refreshInterval: isPWA ? 60000 : 30000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    retryCount: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const { data: activityData } = useSWR<LastActivityData>("/api/stats/last-activity", fetcher, {
    refreshInterval: isPWA ? 30000 : 15000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    retryCount: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const { data: zipData, error: zipError } = useSWR<ZipCodeHeatMapData>("/api/stats/leads-by-city", fetcher, {
    refreshInterval: isPWA ? 120000 : 60000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    retryCount: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Error fetching zip code data:', error)
    }
  })

  // Macomb Township, MI coordinates
  const lat = 42.6655
  const lon = -82.9447

  const { data: weatherData, error: weatherError } = useSWR<WeatherData>(`/api/weather/forecast?lat=${lat}&lon=${lon}`, fetcher, {
    refreshInterval: isPWA ? 600000 : 300000,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    retryCount: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Error fetching weather data:', error)
    }
  })

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  // AUTO-ROTATION DISABLED FOR TESTING
  // useEffect(() => {
  //   if (!api) return
  //   const interval = setInterval(() => {
  //     api.scrollNext()
  //   }, 5000)
  //   return () => clearInterval(interval)
  // }, [api])

  if (isLoading) return <LoadingSkeleton />
  if (error || !data) {
    console.error('GlobalStatsNoAuto: Failed to load stats. Error:', error)
    return (
      <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Global Stats (No Auto-Rotation)
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
    lastLeadEntered,
    topUsers,
  } = data

  // Process weather data for 3-day forecast
  const forecast: WeatherDay[] = weatherData?.daily ? weatherData.daily.slice(0, 3).map((day: any, index: number) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    
    return {
      dayAbbr: date.toLocaleDateString('en-US', { weekday: 'short' }),
      monthAbbr: date.toLocaleDateString('en-US', { month: 'short' }),
      dayOfMonth: date.getDate(),
      temp: Math.round(day.temp.day),
      condition: day.weather[0].main.toLowerCase(),
      icon: day.weather[0].icon
    }
  }) : []

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* PWA Status Indicator (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-orange-100 dark:bg-orange-900 rounded text-xs">
          <strong>GlobalStatsNoAuto Debug:</strong> 
          {isPWA ? ' Running in PWA mode' : ' Running in browser mode'} | 
          Service Worker: {'serviceWorker' in navigator ? 'Available' : 'Not available'} |
          Network: {isOnline ? 'Online' : 'Offline'} |
          Auto-Rotation: DISABLED
        </div>
      )}
      
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {/* Slide 1: Core Stats */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Global Stats (No Auto-Rotation)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 h-full pb-6 sm:pb-8">
                <StatCard title="Total Leads" value={totalLeads} icon={User} />
                <StatCard title="Jobs Completed" value={totalJobsCompleted} icon={CheckCircle} />
                <StatCard title="Contracts Signed" value={totalContractsSigned} icon={FileText} />
                <StatCard title="Notes Left" value={totalNotesLeft} icon={MessageSquare} />
              </CardContent>
            </Card>
          </CarouselItem>
          
          {/* Slide 2: Top Users */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" /> Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 h-full pb-6 sm:pb-8">
                {topUsers.length > 0 ? (
                  topUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-xs sm:text-sm">
                            {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 truncate">
                          {user.name || 'Unknown User'}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {user.leadCount} leads
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">No user data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 3: Lead Status Distribution */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" /> Lead Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 h-full pb-6 sm:pb-8">
                {statusData?.statusCounts ? (
                  statusData.statusCounts.map((status) => (
                    <div key={status.status} className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                        <span className="text-sm sm:text-base text-slate-800 dark:text-slate-200">
                          {status.label}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {status.count}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">No status data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 4: Recent Activity */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 h-full pb-6 sm:pb-8">
                {activityData?.lastActivity ? (
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                    <div className="flex items-start space-x-3">
                      <Activity className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">
                          {activityData.lastActivity.title}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {activityData.lastActivity.userName && `by ${activityData.lastActivity.userName} • `}
                          {activityData.timeAgo}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 5: Top Zip Codes */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" /> Top Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 h-full pb-6 sm:pb-8">
                {zipData?.topZipCodes ? (
                  zipData.topZipCodes.slice(0, 5).map((zip, index) => (
                    <div key={zip.zipCode} className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm sm:text-base text-slate-800 dark:text-slate-200">
                          {zip.zipCode}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">
                          {zip.count} leads
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {zip.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">No location data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 6: Weather Forecast */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <Cloud className="h-4 w-4 sm:h-5 sm:w-5" /> 3-Day Forecast
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Macomb Township, MI
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 h-full pb-6 sm:pb-8">
                {forecast.length > 0 ? (
                  forecast.map((day, index) => (
                    <div key={index} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
                      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        {day.dayAbbr}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {day.monthAbbr} {day.dayOfMonth}
                      </p>
                      <div className="my-1">
                        {getIconForCondition(day.condition)}
                      </div>
                      <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                        {formatTemperature(day.temp)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 flex items-center justify-center">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Weather data unavailable</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 7: Recent Activity (Original) */}
          <CarouselItem>
             <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" /> Lead Entry Activity
                  </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-full pb-6 sm:pb-8">
                   <StatCard title="Last Lead Entered" value={lastLeadEntered} icon={Clock} />
              </CardContent>
             </Card>
          </CarouselItem>

        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
      
      {/* Dot Pagination */}
      <div className="flex justify-center mt-3 sm:mt-4 space-x-2">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 touch-manipulation",
              current === index + 1
                ? "bg-primary scale-125"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1} of ${count}`}
            aria-current={current === index + 1 ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  )
} 