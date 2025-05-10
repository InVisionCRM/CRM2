import { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { GoogleCalendarService } from '@/lib/services/googleCalendar';
import type { CalendarAppointment, RawGCalEvent } from '@/types/appointments';
import { useDebounce } from './useDebounce';
import type { GoogleCalendarCredentials } from '@/lib/services/googleCalendar';

interface UseGoogleCalendarProps {
  view: 'month' | 'week' | 'day';
  currentDate: Date;
  credentials?: GoogleCalendarCredentials | null;
  initialAppointments?: RawGCalEvent[];
  debounceDelay?: number;
}

interface UseGoogleCalendarReturn {
  appointments: RawGCalEvent[];
  isLoading: boolean;
  error: Error | null;
  fetchAppointmentsCallback: (startDate: Date, endDate: Date) => Promise<void>;
  createAppointment: (appointment: CalendarAppointment) => Promise<RawGCalEvent>;
  updateAppointment: (appointment: CalendarAppointment) => Promise<RawGCalEvent>;
  deleteAppointment: (id: string) => Promise<void>;
  refetch: () => void;
  currentMonth: Date;
}

export function useGoogleCalendar({
  view,
  currentDate,
  credentials,
  initialAppointments = [],
  debounceDelay = 500,
}: UseGoogleCalendarProps): UseGoogleCalendarReturn {
  const [appointments, setAppointments] = useState<RawGCalEvent[]>(initialAppointments);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const debouncedCurrentDate = useDebounce(currentDate, debounceDelay);
  const debouncedView = useDebounce(view, debounceDelay);

  const getDateRange = useCallback(() => {
    let start: Date;
    let end: Date;

    switch (debouncedView) {
      case 'month':
        start = startOfMonth(debouncedCurrentDate);
        end = endOfMonth(debouncedCurrentDate);
        break;
      case 'week':
        start = startOfWeek(debouncedCurrentDate, { weekStartsOn: 0 });
        end = endOfWeek(debouncedCurrentDate, { weekStartsOn: 0 });
        break;
      case 'day':
        start = startOfDay(debouncedCurrentDate);
        end = endOfDay(debouncedCurrentDate);
        break;
      default:
        start = startOfMonth(debouncedCurrentDate);
        end = endOfMonth(debouncedCurrentDate);
    }
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }, [debouncedCurrentDate, debouncedView]);

  const fetchAppointmentsCallback = useCallback(async () => {
    if (!credentials) {
      setIsLoading(false);
      setAppointments([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { timeMin, timeMax } = getDateRange();
      const service = new GoogleCalendarService(credentials);
      const events = await service.listEvents(new Date(timeMin), new Date(timeMax));
      setAppointments(events);
    } catch (err) {
      console.error("Failed to fetch Google Calendar events:", err);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('Failed to fetch events'));
      }
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange, credentials]);

  useEffect(() => {
    fetchAppointmentsCallback();
  }, [fetchAppointmentsCallback]);

  const createAppointment = useCallback(
    async (appointmentData: CalendarAppointment): Promise<RawGCalEvent> => {
      if (!credentials) throw new Error("Credentials not provided for createAppointment");
      const service = new GoogleCalendarService(credentials);
      setIsLoading(true);
      try {
        const newAppointment = await service.createEvent(appointmentData);
        setAppointments((prev) => [...prev, newAppointment]);
        setError(null); // Clear previous errors on success
        return newAppointment;
      } catch (err) {
        const errorToSet = err instanceof Error ? err : new Error("An unknown error occurred during event creation.");
        setError(errorToSet);
        console.error("Failed to create appointment:", errorToSet);
        throw errorToSet; // Re-throw the error
      } finally {
        setIsLoading(false);
      }
    },
    [credentials]
  );

  const updateAppointment = useCallback(
    async (appointmentData: CalendarAppointment): Promise<RawGCalEvent> => {
      if (!credentials) throw new Error("Credentials not provided for updateAppointment");
      if (!appointmentData.id) throw new Error("Appointment ID is required for update."); // Added check
      const service = new GoogleCalendarService(credentials);
      setIsLoading(true);
      try {
        const updatedAppointment = await service.updateEvent(appointmentData);
        setAppointments((prev) =>
          prev.map((app) => (app.id === updatedAppointment.id ? updatedAppointment : app))
        );
        setError(null); // Clear previous errors on success
        return updatedAppointment;
      } catch (err) {
        const errorToSet = err instanceof Error ? err : new Error("An unknown error occurred during event update.");
        setError(errorToSet);
        console.error("Failed to update appointment:", errorToSet);
        throw errorToSet; // Re-throw the error
      } finally {
        setIsLoading(false);
      }
    },
    [credentials]
  );

  const deleteAppointment = useCallback(
    async (id: string): Promise<void> => {
      if (!credentials) throw new Error("Credentials not provided for deleteAppointment");
      const service = new GoogleCalendarService(credentials);
      setIsLoading(true);
      try {
        await service.deleteEvent(id);
        setAppointments((prev) => prev.filter((app) => app.id !== id));
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('Failed to delete event'));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [credentials]
  );

  const refetch = () => {
    fetchAppointmentsCallback();
  };

  return {
    appointments,
    isLoading,
    error,
    fetchAppointmentsCallback,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    refetch,
    currentMonth: getDateRange().timeMin ? new Date(getDateRange().timeMin) : new Date(),
  };
} 