import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { CalendarView } from "@/components/calendar-view"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WelcomeAnimationWrapper } from "@/components/welcome-animation-wrapper"
import { DateDebug } from "@/components/date-debug"

export const dynamic = 'force-dynamic';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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
  const resolvedSearchParams = await searchParams;
  const leadId = resolvedSearchParams.leadId as string;
  const leadName = resolvedSearchParams.leadName as string;
  const returnUrl = resolvedSearchParams.returnUrl as string;

  return (
    <DashboardLayout>
      <WelcomeAnimationWrapper />
      <div className="relative min-h-screen">
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
