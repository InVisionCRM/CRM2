import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, Plus } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TestCalendarEvents } from "@/components/test-calendar-events"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen">
        <BackgroundGradientAnimation
          containerClassName="absolute inset-0 w-full h-full"
          gradientBackgroundStart="rgb(220, 230, 255)"
          gradientBackgroundEnd="rgb(240, 240, 255)"
          firstColor="18, 113, 255"
          secondColor="221, 74, 255"
          thirdColor="100, 220, 255"
          fourthColor="200, 50, 50"
          fifthColor="180, 180, 50"
          interactive={true}
          size="100%"
          blendingValue="screen"
        />

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <Link href="/dashboard/events/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Quick Navigation
              </h3>
              <div className="space-y-2">
                <Link href="/dashboard/calendar">
                  <Button variant="outline" className="w-full justify-start">
                    View Calendar
                  </Button>
                </Link>
                <Link href="/dashboard/events">
                  <Button variant="outline" className="w-full justify-start">
                    Manage Events
                  </Button>
                </Link>
                <Link href="/dashboard/events/new">
                  <Button variant="outline" className="w-full justify-start">
                    Create New Event
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4">Account Information</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {session.user?.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {session.user?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Test component to verify calendar access */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow">
            <TestCalendarEvents />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
