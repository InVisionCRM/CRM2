import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { CalendarView } from "@/components/calendar-view"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WelcomeAnimationWrapper } from "@/components/welcome-animation-wrapper"
import { DateDebug } from "@/components/date-debug"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  const credentials = {
    accessToken: session?.accessToken as string,
    refreshToken: session?.refreshToken as string,
  }

  if (!credentials.accessToken) {
    console.error("CalendarPage: accessToken is missing from session.")
    return (
      <DashboardLayout>
        <div className="p-4 text-center">
          <h1 className="text-xl font-semibold text-red-600">Authentication Error</h1>
          <p className="text-gray-700 dark:text-gray-300">Access token not available. Please try signing out and signing back in.</p>
        </div>
      </DashboardLayout>
    )
  }

  // Get lead information from search params
  const leadId = searchParams.leadId as string;
  const leadName = searchParams.leadName as string;
  const returnUrl = searchParams.returnUrl as string;

  return (
    <DashboardLayout>
      <WelcomeAnimationWrapper />
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
          <h1 className="text-2xl font-bold mb-6">
            {leadName ? `Schedule Appointment for ${leadName}` : 'Your Calendar'}
          </h1>
          <DateDebug />
          <CalendarView 
            credentials={credentials}
            leadId={leadId}
            leadName={leadName}
            returnUrl={returnUrl}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
