import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { CalendarView } from "@/components/calendar-view"
// import { DashboardLayout } from "@/components/dashboard-layout"
import { WelcomeAnimationWrapper } from "@/components/welcome-animation-wrapper"
// import { DateDebug } from "@/components/date-debug"

interface CalendarPageProps {
  searchParams: {
    leadId?: string;
    leadName?: string;
    // any other search params you expect
  };
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  const urlLeadId = searchParams.leadId;
  const urlLeadName = searchParams.leadName;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center">
      {/* <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Your Calendar</h1> */}
      {/* <DateDebug /> */}
      <div className="relative z-10 w-full max-w-7xl mx-auto p-0 sm:p-4 md:p-6 mt-32 sm:mt-20 md:mt-24 mb-4 flex flex-col flex-grow">
        <CalendarView 
          credentials={{ 
            accessToken: session.accessToken as string, 
            refreshToken: session.refreshToken as string | undefined 
          }}
          urlLeadId={urlLeadId}
          urlLeadName={urlLeadName}
        />
      </div>
    </div>
  )
}
