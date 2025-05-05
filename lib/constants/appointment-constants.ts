import { AppointmentStatus } from "@prisma/client"
import type { AppointmentPurpose } from "@/types/lead" // Import the corrected type

// Define purpose colors matching the NEW Prisma schema values
export const PURPOSE_COLORS: Record<AppointmentPurpose, string> = {
  INSPECTION: "bg-blue-100 text-blue-800",
  FILE_CLAIM: "bg-indigo-100 text-indigo-800",
  FOLLOW_UP: "bg-yellow-100 text-yellow-800",
  ADJUSTER: "bg-green-100 text-green-800",
  BUILD_DAY: "bg-amber-100 text-amber-800", // gold color
  OTHER: "bg-gray-100 text-gray-800",
}

// Define status colors for appointments (Assuming these are correct)
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RESCHEDULED: "bg-yellow-100 text-yellow-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
}

// PURPOSE_LABELS is now defined in types/appointments.ts

// Define status labels for appointments (Assuming these are correct)
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  RESCHEDULED: "Rescheduled",
  NO_SHOW: "No Show",
}
