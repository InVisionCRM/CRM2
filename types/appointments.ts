export type AppointmentPurpose = "adjuster_appointment" | "pick_up_check" | "build_day" | "meeting_with_client"


export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "rescheduled" | "no_show"

export interface CalendarAppointment {
  id: string
  title: string
  date?: Date
  startTime: string
  endTime: string
  status: string
  leadId: string
  leadName: string
  address?: string
  notes?: string
  type?: string
  purpose?: AppointmentPurpose
}

export interface AppointmentsByDate {
  [date: string]: CalendarAppointment[]
}

export interface AppointmentFormData {
  title: string
  date: Date
  startTime: string
  endTime: string
  purpose: AppointmentPurpose
  status: AppointmentStatus
  clientId: string
  address: string
  notes?: string
}

export const PURPOSE_LABELS: Record<AppointmentPurpose, string> = {
  adjuster_appointment: "Adjuster Appointment",
  pick_up_check: "Pick Up Check",
  build_day: "Build Day",
  meeting_with_client: "Meeting with Client",
}
