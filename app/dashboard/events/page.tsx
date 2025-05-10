import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EventsList } from "@/components/events-list"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"

export default async function EventsPage() {
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
          <h1 className="text-2xl font-bold mb-6">Your Events</h1>
          <EventsList />
        </div>
      </div>
    </DashboardLayout>
  )
}
