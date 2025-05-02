import type { AppointmentPurpose, AppointmentStatus } from "@/types/appointments"

// Define purpose colors for appointments
export const PURPOSE_COLORS: Record<AppointmentPurpose, string> = {
  adjuster_appointment: "bg-green-100 text-green-800",
  pick_up_check: "bg-orange-100 text-orange-800",
  build_day: "bg-amber-100 text-amber-800", // gold color
  meeting_with_client: "bg-blue-100 text-blue-800",
}

// Define status colors for appointments
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  rescheduled: "bg-yellow-100 text-yellow-800",
  no_show: "bg-gray-100 text-gray-800",
}

// Define purpose labels for appointments
export const PURPOSE_LABELS: Record<AppointmentPurpose, string> = {
  adjuster_appointment: "Adjuster Appointment",
  pick_up_check: "Pick Up Check",
  build_day: "Build Day",
  meeting_with_client: "Meeting with Client",
}

// Define status labels for appointments
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
  no_show: "No Show",
}
