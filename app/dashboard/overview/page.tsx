import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardContent } from "@/components/dashboard-content"

// The previous home page, preserved here so its sections (stats, recent
// activity, uploads, emails, my leads) remain accessible after the new
// "My Day" dashboard became the home page at /dashboard.
export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return <DashboardContent />
}
