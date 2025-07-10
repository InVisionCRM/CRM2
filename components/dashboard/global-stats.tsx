"use client"

import useSWR from "swr"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
import { TrendingUp, FileText, CheckCircle, MessageSquare, Clock, User, Award } from "lucide-react"

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

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
  <div className="flex items-center space-x-4">
    <Icon className="h-8 w-8 text-primary" />
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
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


export function GlobalStats() {
  const { data, error, isLoading } = useSWR<GlobalStatsData>("/api/stats/global", fetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds
  })

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

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full max-w-6xl mx-auto"
    >
      <CarouselContent>
        {/* Slide 1: Core Stats */}
        <CarouselItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp /> Global Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard title="Total Leads" value={totalLeads} icon={User} />
              <StatCard title="Jobs Completed" value={totalJobsCompleted} icon={CheckCircle} />
              <StatCard title="Contracts Signed" value={totalContractsSigned} icon={FileText} />
              <StatCard title="Notes Left" value={totalNotesLeft} icon={MessageSquare} />
            </CardContent>
          </Card>
        </CarouselItem>
        
        {/* Slide 2: Top Users */}
        <CarouselItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award /> Top Performers
              </CardTitle>
              <CardDescription>By total leads assigned</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row justify-around items-center gap-4">
              {topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{index + 1}. {user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.leadCount} leads</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </CarouselItem>

        {/* Slide 3: Recent Activity */}
        <CarouselItem>
           <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock /> Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
                 <StatCard title="Last Lead Entered" value={lastLeadEntered} icon={Clock} />
            </CardContent>
           </Card>
        </CarouselItem>

      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  )
} 