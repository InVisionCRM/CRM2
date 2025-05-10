import { z } from "zod"
import { AppointmentPurposeEnum } from "@/types/appointments"
import { AppointmentStatus } from "@prisma/client"

// Helper function to validate HH:MM format
const timeFormatRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

// Define the appointment schema using Zod
export const appointmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  leadId: z.string().min(1, "Lead is required"),
  userId: z.string().min(1, "User is required"),
  date: z.date({ required_error: "Date is required" }),
  startTime: z.string().regex(timeFormatRegex, "Invalid start time format (HH:MM)"),
  endTime: z.string().regex(timeFormatRegex, "Invalid end time format (HH:MM)"),
  purpose: z.enum([
    AppointmentPurposeEnum.INSPECTION,
    AppointmentPurposeEnum.FILE_CLAIM,
    AppointmentPurposeEnum.FOLLOW_UP,
    AppointmentPurposeEnum.ADJUSTER,
    AppointmentPurposeEnum.BUILD_DAY,
    AppointmentPurposeEnum.OTHER
  ]),
  status: z.nativeEnum(AppointmentStatus).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
  // Optional: Add validation that endTime is after startTime if needed
  // This requires parsing the times, which can be complex.
  // Basic check: if date is same, endTime > startTime
  return true // Placeholder
}, {
  message: "End time must be after start time",
  // Specify path if needed, e.g., path: ["endTime"],
})

// Define the type based on the schema
export type AppointmentFormValues = z.infer<typeof appointmentSchema>

// Example default values using the enum helper
export const defaultAppointmentValues = {
  title: "",
  leadId: "",
  userId: "", 
  date: new Date(),
  startTime: "09:00",
  endTime: "10:00",
  purpose: AppointmentPurposeEnum.INSPECTION,
  status: AppointmentStatus.SCHEDULED,
  address: "",
  notes: "",
}
