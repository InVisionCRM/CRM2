import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Hero } from "@/components/ui/hero"
import { TodayAgenda } from "@/components/dashboard/today-agenda"
import { ActionQueue } from "@/components/dashboard/action-queue"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const firstName = session.user?.name?.split(" ")[0] || "there"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <div className="flex-1 h-full overflow-y-auto pb-16">
      <Hero />

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Personalized greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span style={{ color: "#A4D65E" }}>{firstName}</span>
          </h1>
          <p className="text-sm text-white/50">Here&apos;s your day at a glance.</p>
        </div>

        {/* Two-column on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <TodayAgenda />
          <ActionQueue />
        </div>
      </div>
    </div>
  )
}
