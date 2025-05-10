import { EventForm } from "@/components/event-form"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function NewEventPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <EventForm />
        </div>
      </div>
    </DashboardLayout>
  )
}
