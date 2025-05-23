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
  private isRefreshingToken = false; // Prevent concurrent refresh attempts
  private retryCount = 0; // Prevent infinite retry loops

  constructor(credentials: GoogleCalendarCredentials) {
    this.credentials = credentials;
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.credentials.refreshToken) {
      console.warn('No refresh token available to refresh access token.');
      return null;
    }

    this.isRefreshingToken = true;
    try {
      console.log('Attempting to refresh Google access token...');
      // This API route needs to be created.
      // It will take the refreshToken from the session (implicitly, or passed if needed)
      // and return a new accessToken.
      const response = await fetch('/api/auth/refresh-google-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Optionally, if your API route needs the old refresh token explicitly
        // body: JSON.stringify({ refreshToken: this.credentials.refreshToken })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to refresh token, unknown error' }));
        console.error('Failed to refresh access token:', response.status, errorData.message);
        throw new Error(errorData.message || 'Failed to refresh access token');
      }

      const data = await response.json();
      if (data.accessToken) {
        console.log('Successfully refreshed Google access token.');
        this.credentials.accessToken = data.accessToken;
        // If the refresh endpoint also returns a new refresh_token, update it:
        // if (data.refreshToken) {
        //   this.credentials.refreshToken = data.refreshToken;
        // }
        this.retryCount = 0; // Reset retry count on successful refresh
        return data.accessToken;
      } else {
        console.error('Refresh token endpoint did not return an access token.');
        throw new Error('Refresh token endpoint did not return an access token.');
      }
    } catch (error) {
      console.error('Error during access token refresh:', error);
      return null;
    } finally {
      this.isRefreshingToken = false;
    }
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<any> {
    if (this.isRefreshingToken && !isRetry) {
      // Wait for the ongoing refresh to complete before making a new request
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (!this.isRefreshingToken) {
            clearInterval(interval);
            resolve(null);
          }
        }, 100);
      });
    }
    
    try {
      const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
        // Google often returns 401 for expired/invalid token, but can also be 403 for other permission issues.
        if ((response.status === 401 || response.status === 403) && !isRetry && this.retryCount < 1) {
          this.retryCount++;
          console.warn(`Google API request failed with status ${response.status}. Attempting token refresh.`);
          const newAccessToken = await this.refreshAccessToken();
          if (newAccessToken) {
            // Retry the original request with the new token
            return this.fetchWithAuth(endpoint, options, true);
          } else {
            // If refresh failed, throw the original error or a specific auth error
            throw new Error(errorData.error?.message || `Auth error after failed refresh: ${response.status}`);
          }
        }
        throw new Error(errorData.error?.message || GOOGLE_CALENDAR_CONFIG.ERRORS.FETCH_EVENTS);
      }
      this.retryCount = 0; // Reset retry count on successful API call
      return response.json();
    } catch (error) {
      // If it's an error from our own refresh logic, or a retry already failed.
      console.error('Error in fetchWithAuth:', error);
      throw error;
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
    // Create date object in local time
    const startDateTime = appointment.date ? new Date(appointment.date) : new Date();
    
    // Parse the time and set hours/minutes
    if (typeof appointment.startTime === 'string' && appointment.startTime.includes(':')) {
      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);
    }

    // Create end time (1 hour after start time by default)
    const endDateTime = new Date(startDateTime);
    if (typeof appointment.endTime === 'string' && appointment.endTime.includes(':')) {
      const [hours, minutes] = appointment.endTime.split(':').map(Number);
      endDateTime.setHours(hours, minutes, 0, 0);
    } else {
      endDateTime.setHours(startDateTime.getHours() + 1, startDateTime.getMinutes(), 0, 0);
    }

    // Ensure endDateTime is after startDateTime
    if (endDateTime <= startDateTime) {
      endDateTime.setHours(startDateTime.getHours() + 1, startDateTime.getMinutes(), 0, 0);
    }

    const targetTimeZone = appointment.timeZone || 'America/New_York';

    return {
      summary: appointment.title,
      location: appointment.address,
      description: appointment.notes,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: targetTimeZone, 
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: targetTimeZone, 
      },
      colorId: appointment.purpose ? GOOGLE_CALENDAR_CONFIG.COLOR_MAP[appointment.purpose as AppointmentPurposeType] : undefined,
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