import { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { GoogleCalendarService } from '@/lib/services/googleCalendar';
import type { CalendarAppointment } from '@/types/appointments';

interface UseGoogleCalendarProps {
  view: 'month' | 'week' | 'day';
  currentDate: Date;
  credentials: {
    accessToken: string;
    refreshToken?: string;
  };
}

interface UseGoogleCalendarReturn {
  appointments: CalendarAppointment[];
  isLoading: boolean;
  error: Error | null;
  createAppointment: (appointment: CalendarAppointment) => Promise<CalendarAppointment>;
  updateAppointment: (appointment: CalendarAppointment) => Promise<CalendarAppointment>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useGoogleCalendar({
  view,
  currentDate,
  credentials,
}: UseGoogleCalendarProps): UseGoogleCalendarReturn {
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calendarService = new GoogleCalendarService(credentials);

  const getDateRange = useCallback(() => {
    switch (view) {
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
      case 'week':
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        };
      case 'day':
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        };
    }
  }, [view, currentDate]);

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { start, end } = getDateRange();
      const events = await calendarService.listEvents(start, end);
      setAppointments(events);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch appointments'));
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, getDateRange]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = async (appointment: CalendarAppointment) => {
    try {
      const created = await calendarService.createEvent(appointment);
      setAppointments(prev => [...prev, created]);
      return created;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create appointment');
    }
  };

  const updateAppointment = async (appointment: CalendarAppointment) => {
    try {
      const updated = await calendarService.updateEvent(appointment);
      setAppointments(prev =>
        prev.map(apt => (apt.id === updated.id ? updated : apt))
      );
      return updated;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update appointment');
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      await calendarService.deleteEvent(appointmentId);
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete appointment');
    }
  };

  return {
    appointments,
    isLoading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch: fetchAppointments,
  };
} 