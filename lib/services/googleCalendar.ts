import type { CalendarAppointment, AppointmentPurpose as AppointmentPurposeType, RawGCalEvent } from '@/types/appointments';
import { GOOGLE_CALENDAR_CONFIG } from '@/lib/google-calendar';
import { AppointmentPurpose } from "@prisma/client";

export interface GoogleCalendarCredentials {
  accessToken: string;
  refreshToken?: string | null;
}

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export class GoogleCalendarService {
  private credentials: GoogleCalendarCredentials;

  constructor(credentials: GoogleCalendarCredentials) {
    this.credentials = credentials;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || GOOGLE_CALENDAR_CONFIG.ERRORS.FETCH_EVENTS);
    }

    return response.json();
  }

  async listEvents(timeMin: Date, timeMax: Date): Promise<RawGCalEvent[]> {
    try {
      const params = new URLSearchParams({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const response = await this.fetchWithAuth(`/calendars/primary/events?${params}`);
      
      return (response.items || []) as RawGCalEvent[];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<RawGCalEvent> {
    try {
      const response = await this.fetchWithAuth(`/calendars/primary/events/${eventId}`);
      return response as RawGCalEvent;
    } catch (error) {
      console.error(`Error fetching Google Calendar event ${eventId}:`, error);
      throw new Error(GOOGLE_CALENDAR_CONFIG.ERRORS.FETCH_EVENTS);
    }
  }

  async createEvent(appointment: CalendarAppointment): Promise<RawGCalEvent> {
    try {
      const event = this.appointmentToGoogleEvent(appointment);
      
      const response = await this.fetchWithAuth('/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(event),
      });

      return response as RawGCalEvent;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new Error(GOOGLE_CALENDAR_CONFIG.ERRORS.CREATE_EVENT);
    }
  }

  async updateEvent(appointment: CalendarAppointment): Promise<RawGCalEvent> {
    try {
      const event = this.appointmentToGoogleEvent(appointment);
      
      const response = await this.fetchWithAuth(`/calendars/primary/events/${appointment.id}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      });

      return response as RawGCalEvent;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw new Error(GOOGLE_CALENDAR_CONFIG.ERRORS.UPDATE_EVENT);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.fetchWithAuth(`/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw new Error(GOOGLE_CALENDAR_CONFIG.ERRORS.DELETE_EVENT);
    }
  }

  private appointmentToGoogleEvent(appointment: CalendarAppointment) {
    const startDateTime = appointment.date ? new Date(appointment.date) : new Date();
    const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes);

    const endDateTime = new Date(startDateTime);
    if (appointment.endTime) {
      const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes);
    } else {
      endDateTime.setHours(startDateTime.getHours() + 1);
    }

    let colorIdValue: string | undefined = undefined;
    if (appointment.purpose && (Object.values(AppointmentPurpose) as string[]).includes(appointment.purpose)) {
      colorIdValue = GOOGLE_CALENDAR_CONFIG.COLOR_MAP[appointment.purpose as AppointmentPurposeType];
    }

    return {
      summary: appointment.title,
      location: appointment.address,
      description: appointment.notes,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: GOOGLE_CALENDAR_CONFIG.DEFAULTS.TIME_ZONE,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: GOOGLE_CALENDAR_CONFIG.DEFAULTS.TIME_ZONE,
      },
      colorId: colorIdValue,
      extendedProperties: {
        private: {
          leadId: appointment.leadId || '',
          leadName: appointment.leadName || '',
          purpose: appointment.purpose || '',
          status: appointment.status || 'scheduled',
        },
      },
    };
  }
} 