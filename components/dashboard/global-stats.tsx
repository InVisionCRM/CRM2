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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-6 w-[100px]" />
        </div>
      </div>
       <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-6 w-[100px]" />
        </div>
      </div>
    </CardContent>
  </Card>
)

const getStatusColor = (status: LeadStatus): string => {
  switch (status) {
    case LeadStatus.signed_contract:
      return "bg-blue-500/20 text-blue-500 border-blue-500/30"
    case LeadStatus.scheduled:
      return "bg-purple-500/20 text-purple-500 border-purple-500/30"
    case LeadStatus.colors:
      return "bg-indigo-500/20 text-indigo-500 border-indigo-500/30"
    case LeadStatus.acv:
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
    case LeadStatus.job:
      return "bg-orange-500/20 text-orange-500 border-orange-500/30"
    case LeadStatus.completed_jobs:
      return "bg-green-500/20 text-green-500 border-green-500/30"
    case LeadStatus.zero_balance:
      return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
    case LeadStatus.denied:
      return "bg-red-500/20 text-red-500 border-red-500/30"
    case LeadStatus.follow_ups:
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
    default:
      return "bg-gray-500/20 text-gray-500 border-gray-500/30"
  }
}

const getIconForCondition = (condition: string) => {
  switch (condition) {
    case 'clear':
      return <Sun className="w-6 h-6 text-yellow-400" />
    case 'clouds':
      return <Cloud className="w-6 h-6 text-gray-300" />
    case 'rain':
      return <CloudRain className="w-6 h-6 text-blue-400" />
    case 'snow':
      return <CloudSnow className="w-6 h-6 text-white" />
    case 'thunderstorm':
      return <CloudLightning className="w-6 h-6 text-purple-400" />
    case 'drizzle':
      return <CloudDrizzle className="w-6 h-6 text-cyan-300" />
    case 'fog':
    case 'mist':
      return <CloudFog className="w-6 h-6 text-gray-400" />
    default:
      return <Cloud className="w-6 h-6 text-gray-300" />
  }
}

const formatTemperature = (temp: number) => {
  const rounded = Math.round(temp)
  return rounded.toString().padStart(2, '0')
}

export function GlobalStats() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const { data, error, isLoading } = useSWR<GlobalStatsData>("/api/stats/global", fetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds
  })

  const { data: statusData } = useSWR<StatusCountData>("/api/stats/lead-status-counts", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const { data: activityData } = useSWR<LastActivityData>("/api/stats/last-activity", fetcher, {
    refreshInterval: 15000, // Refresh every 15 seconds
  })

  const { data: zipData, error: zipError } = useSWR<ZipCodeHeatMapData>("/api/stats/leads-by-city", fetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds
    onError: (error) => {
      console.error('Error fetching zip code data:', error)
    }
  })

  // Macomb Township, MI coordinates
  const lat = 42.6655
  const lon = -82.9447

  const { data: weatherData, error: weatherError } = useSWR<WeatherData>(`/api/weather/forecast?lat=${lat}&lon=${lon}`, fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes
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

  // Auto-rotation effect
  useEffect(() => {
    if (!api) return

    const interval = setInterval(() => {
      api.scrollNext()
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [api])

  if (isLoading) return <LoadingSkeleton />
  if (error || !data) return <p className="text-center text-destructive">Failed to load stats.</p>

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
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Global Stats
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
                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">By total leads assigned</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col justify-center items-center gap-3 sm:gap-4 md:flex-row md:justify-around h-full pb-6 sm:pb-8">
                {topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center gap-3 w-full md:w-auto">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base">{index + 1}. {user.name}</p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{user.leadCount} leads</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 3: Lead Status Counts */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" /> Lead Status Overview
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">Current distribution of leads by status</CardDescription>
              </CardHeader>
              <CardContent className="h-full pb-6 sm:pb-8 overflow-y-auto">
                {statusData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                    {statusData.statusCounts.map(({ status, count, label }) => (
                      <div key={status} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                          <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-200">{count}</p>
                        </div>
                        <Badge className={cn("border text-xs", getStatusColor(status))}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Loading status data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 4: Zip Code Heat Map */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" /> Lead Heat Map
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">Top 3 zip codes with most leads</CardDescription>
              </CardHeader>
              <CardContent className="h-full pb-6 sm:pb-8 overflow-y-auto">
                {zipData && zipData.topZipCodes && Array.isArray(zipData.topZipCodes) ? (
                  <div className="space-y-2 sm:space-y-4">
                    {zipData.topZipCodes.length > 0 ? (
                      zipData.topZipCodes.map(({ zipCode, count, rank, percentage }) => (
                        <div key={zipCode} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={cn(
                              "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-white font-bold text-xs sm:text-sm",
                              rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-gray-400" : "bg-orange-600"
                            )}>
                              #{rank}
                            </div>
                            <div>
                              <p className="font-semibold text-base sm:text-lg text-slate-800 dark:text-slate-200">{zipCode}</p>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{percentage}% of all leads</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl sm:text-2xl font-bold text-primary">{count}</p>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">leads</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-600 dark:text-slate-400 text-sm">No zip code data available</p>
                      </div>
                    )}
                  </div>
                ) : zipError ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-destructive text-sm">Error loading zip code data</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Loading zip code data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 5: Weather Forecast */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <Cloud className="h-4 w-4 sm:h-5 sm:w-5" /> Weather Forecast
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">3-day outlook for Macomb Township, MI</CardDescription>
              </CardHeader>
              <CardContent className="h-full pb-6 sm:pb-8 flex items-center justify-center">
                {weatherData && forecast.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
                    {forecast.map((day) => (
                      <div
                        key={`${day.dayAbbr}-${day.dayOfMonth}`}
                        className="flex flex-col items-center p-2 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{day.dayAbbr}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                          {day.monthAbbr} {day.dayOfMonth}
                        </span>
                        <div className="mb-2 flex items-center justify-center">
                          <div className="scale-75 sm:scale-100">
                            {getIconForCondition(day.condition)}
                          </div>
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-primary">
                          {formatTemperature(day.temp)}°
                        </span>
                      </div>
                    ))}
                  </div>
                ) : weatherError ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-destructive text-sm">Error loading weather data</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Loading weather data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>

          {/* Slide 6: Last Activity */}
          <CarouselItem>
            <Card className="h-[350px] sm:h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-lg sm:text-xl">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" /> Recent Activity
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">Latest system activity</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full space-y-3 sm:space-y-4 pb-6 sm:pb-8">
                {activityData ? (
                  <>
                    <div className="text-center">
                      <p className="text-2xl sm:text-3xl font-bold text-primary">{activityData.timeAgo}</p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Last Activity</p>
                    </div>
                    {activityData.lastActivity && (
                      <div className="text-center space-y-1 sm:space-y-2">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm sm:text-base">{activityData.lastActivity.title}</p>
                        {activityData.lastActivity.userName && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            by {activityData.lastActivity.userName}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <StatCard title="Last Activity" value="Loading..." icon={Clock} />
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
          />
        ))}
      </div>
    </div>
  )
} 