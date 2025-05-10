import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EventForm } from "@/components/event-form"
import { GoogleCalendarService } from "@/lib/services/googleCalendar"

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    console.error("No access token found in session");
    redirect("/")
  }

  try {
    const calendarService = new GoogleCalendarService({ accessToken: session.accessToken });
    const event = await calendarService.getEvent(params.id)

    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <EventForm event={event} />
          </div>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Error fetching event:", error)
    redirect("/dashboard/events")
  }
}
