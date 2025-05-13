import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { CalendarView } from "@/components/calendar-view"
// import { DashboardLayout } from "@/components/dashboard-layout"
import { WelcomeAnimationWrapper } from "@/components/welcome-animation-wrapper"
// import { DateDebug } from "@/components/date-debug"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"

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
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
      <BackgroundGradientAnimation
        containerClassName="absolute inset-0 w-full h-full"
        gradientBackgroundStart="rgb(0, 0, 0)"
        gradientBackgroundEnd="rgba(35, 235, 21, 0.43)"
        firstColor="18, 113, 255"
        secondColor="221, 74, 255"
        thirdColor="100, 220, 255"
        fourthColor="200, 50, 50"
        fifthColor="180, 180, 50"
        interactive={true}
        size="100%"
        blendingValue="screen"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto p-0 sm:p-4 md:p-6 mt-32 sm:mt-20 md:mt-24 mb-4 flex flex-col flex-grow">
        {/* <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Your Calendar</h1> */}
        {/* <DateDebug /> */}
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
