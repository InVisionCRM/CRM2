import type { CalendarAppointment, AppointmentPurpose as AppointmentPurposeType, RawGCalEvent } from '@/types/appointments'
import { GOOGLE_CALENDAR_CONFIG } from '@/lib/google-calendar'
import { AppointmentPurpose } from '@prisma/client'
import { format, addHours, parseISO } from 'date-fns'

export interface GoogleCalendarCredentials {
  accessToken: string
  refreshToken?: string | null
}

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

export class GoogleCalendarService {
  private credentials: GoogleCalendarCredentials
  private isRefreshingToken = false
  private retryCount = 0

  constructor(credentials: GoogleCalendarCredentials) {
    this.credentials = credentials
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.credentials.refreshToken) {
      console.warn('No refresh token available to refresh access token.')
      return null
    }

    this.isRefreshingToken = true
    try {
      console.log('Attempting to refresh Google access token...')
      const response = await fetch('/api/auth/refresh-google-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to refresh token, unknown error' }))
        console.error('Failed to refresh access token:', response.status, errorData.message)
        throw new Error(errorData.message || 'Failed to refresh access token')
      }

      const data = await response.json()
      if (data.accessToken) {
        console.log('Successfully refreshed Google access token.')
        this.credentials.accessToken = data.accessToken
        this.retryCount = 0
        return data.accessToken
      } else {
        console.error('Refresh token endpoint did not return an access token.')
        throw new Error('Refresh token endpoint did not return an access token.')
      }
    } catch (error) {
      console.error('Error during access token refresh:', error)
      return null
    } finally {
      this.isRefreshingToken = false
    }
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<any> {
    if (this.isRefreshingToken && !isRetry) {
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!this.isRefreshingToken) {
            clearInterval(interval)
            resolve(null)
          }
        }, 100)
      })
    }

    try {
      const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...((options.headers as Record<string, string>) || {}),
          Authorization: `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }))
        if ((response.status === 401 || response.status === 403) && !isRetry && this.retryCount < 1) {
          this.retryCount++
          console.warn(`Google API request failed with status ${response.status}. Attempting token refresh.`)
          const newAccessToken = await this.refreshAccessToken()
          if (newAccessToken) {
            return this.fetchWithAuth(endpoint, options, true)
          } else {
            throw new Error(errorData.error?.message || `Auth error after failed refresh: ${response.status}`)
          }
        }
        throw new Error(errorData.error?.message || GOOGLE_CALENDAR_CONFIG.ERRORS.FETCH_EVENTS)
      }

      this.retryCount = 0
      return response.json()
    } catch (error) {
      console.error('Error in fetchWithAuth:', error)
      throw error
    }
  }

  async listEvents(timeMin: Date, timeMax: Date): Promise<RawGCalEvent[]> {
    try {
      const params = new URLSearchParams({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      })

      const response = await this.fetchWithAuth(`/calendars/primary/events?${params}`)
      return (response.items || []) as RawGCalEvent[]
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error)
      throw error
    }
  }

  async getEvent(eventId: string): Promise<RawGCalEvent> {
    try {
      const response = await this.fetchWithAuth(`/calendars/primary/events/${encodeURIComponent(eventId)}`)
      return response as RawGCalEvent
    } catch (error) {
      console.error(`Error fetching Google Calendar event ${eventId}:`, error)
      throw new Error(GOOGLE_CALENDAR_CONFIG.ERRORS.FETCH_EVENTS)
    }
  }

  async createEvent(appointment: CalendarAppointment): Promise<RawGCalEvent> {
    try {
      const event = this.appointmentToGoogleEvent(appointment)
      const response = await this.fetchWithAuth('/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(event),
      })
      return response as RawGCalEvent
    } catch (error) {
      console.error('Error creating Google Calendar event:', error)
      throw new Error(GOOGLE_CALENDAR_CONFIG.ERRORS.CREATE_EVENT)
    }
  }

  async updateEvent(appointment: CalendarAppointment): Promise<RawGCalEvent> {
    try {
      const event = this.appointmentToGoogleEvent(appointment)
      const response = await this.fetchWithAuth(`/calendars/primary/events/${encodeURIComponent(appointment.id)}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      })
      return response as RawGCalEvent
    } catch (error) {
      console.error('Error updating Google Calendar event:', error)
      throw new Error(GOOGLE_CALENDAR_CONFIG.ERRORS.UPDATE_EVENT)
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.fetchWithAuth(`/calendars/primary/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error)
      throw new Error(GOOGLE_CALENDAR_CONFIG.ERRORS.DELETE_EVENT)
    }
  }

  private appointmentToGoogleEvent(appointment: CalendarAppointment) {
    // 1. Ensure date is defined
    if (!appointment.date) {
      throw new Error('Cannot create Google event: appointment.date is undefined')
    }

    // 2. Format date portion without using toISOString split (so it remains local)
    const datePart = format(appointment.date, 'yyyy-MM-dd') // e.g. "2025-06-06"

    // 3. Validate and normalize startTime
    if (!appointment.startTime || !/^\d{1,2}:\d{2}(?::\d{2})?$/.test(appointment.startTime)) {
      throw new Error('Invalid or missing appointment.startTime; expected "HH:mm" or "HH:mm:ss"')
    }
    // If missing seconds, add ":00"
    const startTimeParts = appointment.startTime.split(':')
    let [h, m, s] = startTimeParts
    if (startTimeParts.length === 2) {
      s = '00'
    }
    const hh = h.padStart(2, '0')
    const mm = m.padStart(2, '0')
    const ss = (s || '00').padStart(2, '0')
    const startTimeLocal = `${datePart}T${hh}:${mm}:${ss}` // e.g. "2025-06-06T10:00:00"

    // 4. Build a Date object for start, then compute end by adding 1 hour (or use appointment.endTime if provided)
    const startDateObj = parseISO(`${datePart}T${hh}:${mm}:${ss}`)
    let endDateObj: Date
    if (appointment.endTime && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(appointment.endTime)) {
      const endParts = appointment.endTime.split(':')
      let [eh, em, es] = endParts as [string, string, string?]
      if (endParts.length === 2) {
        es = '00'
      }
      const ehh = eh.padStart(2, '0')
      const emm = em.padStart(2, '0')
      const ess = (es || '00').padStart(2, '0')
      endDateObj = parseISO(`${datePart}T${ehh}:${emm}:${ess}`)
      // If end is before or equal to start, roll to next day
      if (endDateObj <= startDateObj) {
        endDateObj = addHours(startDateObj, 1)
      }
    } else {
      endDateObj = addHours(startDateObj, 1)
    }
    const endDatePart = format(endDateObj, 'yyyy-MM-dd')
    const endTimePart = format(endDateObj, 'HH:mm:ss')
    const endTimeLocal = `${endDatePart}T${endTimePart}`

    // 5. Time zone (must exist or fallback)
    const targetTimeZone = appointment.timeZone || 'America/New_York'

    return {
      summary: appointment.title,
      location: appointment.address,
      description: appointment.notes,
      start: {
        dateTime: startTimeLocal,
        timeZone: targetTimeZone,
      },
      end: {
        dateTime: endTimeLocal,
        timeZone: targetTimeZone,
      },
      colorId: appointment.purpose
        ? GOOGLE_CALENDAR_CONFIG.COLOR_MAP[appointment.purpose as AppointmentPurposeType]
        : undefined,
      extendedProperties: {
        private: {
          leadId:   appointment.leadId || '',
          leadName: appointment.leadName || '',
          purpose:  appointment.purpose || '',
          status:   appointment.status || 'scheduled',
        },
      },
    }
  }
}
