import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppointmentStatus, AppointmentSummary } from "@/types/dashboard"
import Link from "next/link"

// Mock data for demonstration
const mockAppointments: AppointmentSummary[] = [
  {
    id: "1",
    clientName: "John Smith",
    address: "123 Main St, Anytown",
    date: new Date(2023, 6, 25, 10, 30),
    status: "scheduled",
    leadId: "1", // Add leadId
  },
  {
    id: "2",
    clientName: "Sarah Johnson",
    address: "456 Oak Ave, Somewhere",
    date: new Date(2023, 6, 25, 14, 0),
    status: "rescheduled",
    leadId: "2", // Add leadId
  },
  {
    id: "3",
    clientName: "Michael Brown",
    address: "789 Pine Rd, Elsewhere",
    date: new Date(2023, 6, 26, 9, 0),
    status: "scheduled",
    leadId: "3", // Add leadId
  },
]

const getStatusColor = (status: AppointmentStatus) => {
  const statusColors = {
    scheduled: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
    rescheduled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
  }

  return statusColors[status] || ""
}

export function AppointmentsList() {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  }

  return (
    <div className="space-y-3">
      {mockAppointments.map((appointment) => (
        <Link href={`/leads/${appointment.leadId}`} key={appointment.id} className="block">
          <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{appointment.clientName}</h3>
                <Badge className={cn("font-normal", getStatusColor(appointment.status))}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                  <span>{appointment.address}</span>
                </div>
                <div className="flex text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                  <span>{formatDate(appointment.date)}</span>
                </div>
                <div className="flex text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                  <span>{formatTime(appointment.date)}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
