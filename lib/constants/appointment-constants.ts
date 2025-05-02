import type { AppointmentPurpose, AppointmentStatus } from "@/types/appointments"

// Define purpose colors for appointments
export const PURPOSE_COLORS: Record<AppointmentPurpose, string> = {
  ADJUSTER_APPOINTMENT: "bg-green-100 text-green-800",
  PICK_UP_CHECK: "bg-orange-100 text-orange-800",
  BUILD_DAY: "bg-amber-100 text-amber-800", // gold color
  MEETING_WITH_CLIENT: "bg-blue-100 text-blue-800",
}

// Define status colors for appointments
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RESCHEDULED: "bg-yellow-100 text-yellow-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
}

// Define purpose labels for appointments
export const PURPOSE_LABELS: Record<AppointmentPurpose, string> = {
  ADJUSTER_APPOINTMENT: "Adjuster Appointment",
  PICK_UP_CHECK: "Pick Up Check",
  BUILD_DAY: "Build Day",
  MEETING_WITH_CLIENT: "Meeting with Client",
}

// Define status labels for appointments
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESCHEDULED: "Rescheduled",
  NO_SHOW: "No Show",
}
