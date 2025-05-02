import { z } from "zod"
import type { AppointmentPurpose, AppointmentStatus } from "@/types/lead"

// Define the appointment schema using Zod
export const appointmentSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  date: z.date({
    required_error: "Appointment date is required.",
  }),
  startTime: z.string({
    required_error: "Start time is required.",
  }),
  endTime: z.string({
    required_error: "End time is required.",
  }),
  purpose: z.string({
    required_error: "Purpose is required.",
  }) as z.ZodType<AppointmentPurpose>,
  status: z.string().default("scheduled") as z.ZodType<AppointmentStatus>,
  clientId: z.string({
    required_error: "Client is required.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  notes: z.string().optional(),
})

// Define the type based on the schema
export type AppointmentFormValues = z.infer<typeof appointmentSchema>

// Default values for the form
export const defaultAppointmentValues: Partial<AppointmentFormValues> = {
  title: "",
  date: new Date(),
  startTime: "09:00 AM",
  endTime: "10:00 AM",
  purpose: "initial_assessment",
  status: "scheduled",
  clientId: "",
  address: "",
  notes: "",
}
