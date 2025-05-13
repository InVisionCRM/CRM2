"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, ChevronUp, Check, Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { createPortal } from "react-dom"
import { Calendar } from "@/components/appointments/calendar"
import type { CalendarAppointment, RawGCalEvent } from "@/types/appointments"
import { AppointmentPurposeEnum } from '@/types/appointments'
import debounce from 'lodash.debounce'
import { useToast } from "@/components/ui/use-toast"

// Mock data for appointments (can be replaced with real data fetching)
const mockAppointments: CalendarAppointment[] = [
  {
    id: "1",
    title: "Initial Consultation with Lead 123",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Two days from now
    startTime: "10:00", // Example HH:mm
    endTime: "11:00",   // Example HH:mm
    purpose: AppointmentPurposeEnum.OTHER, 
    address: "123 Main St, Anytown, USA",
    leadId: "lead123",
    status: "SCHEDULED", 
    leadName: "Lead 123 Name"
  },
  {
    id: "2",
    title: "Adjuster Meeting",
    date: new Date(),  // Today
    startTime: "14:00", // Was "2:00 PM"
    endTime: "15:00",   // Was "3:00 PM"
    purpose: AppointmentPurposeEnum.OTHER,
    status: "SCHEDULED", // Was "scheduled"
    leadId: "2",
    leadName: "Sarah Johnson",
    address: "456 Oak Ave, Somewhere",
  }
];

// Custom DatePicker Component - copied from InsuranceForm
const CustomDatePicker = ({ 
  value = "", 
  onChange, 
  disabled = false,
  placeholder = "Select date" 
}: { 
  value?: string; 
  onChange: (date: string) => void; 
  disabled?: boolean;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    onChange(format(newDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentMonth);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full">
      <div 
        className={cn(
          "flex items-center justify-between px-3 py-2 bg-white bg-opacity-10 rounded-md cursor-pointer h-9 sm:h-10",
          "border border-transparent hover:border-gray-600 text-white w-full text-sm",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <span className={selectedDate ? "text-white" : "text-white text-opacity-50"}>
          {selectedDate ? format(selectedDate, 'MM/dd/yyyy') : placeholder}
        </span>
        <CalendarIcon size={28} className="text-white opacity-70" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2">
          <div 
            ref={modalRef}
            className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-xs overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Date picker dialog"
          >
            <div className="p-3 bg-zinc-700 flex justify-between items-center">
              <h3 className="text-white text-base font-semibold">Select Date</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-zinc-600 rounded-full p-1.5"
                aria-label="Close date picker"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <button 
                  onClick={prevMonth}
                  className="text-white bg-zinc-700 hover:bg-zinc-600 p-2 rounded-full touch-manipulation"
                  aria-label="Previous month"
                >
                  <ChevronUp size={18} className="rotate-270" />
                </button>
                <div className="text-white text-base font-medium">
                  {`${monthName} ${currentMonth.getFullYear()}`}
                </div>
                <button 
                  onClick={nextMonth}
                  className="text-white bg-zinc-700 hover:bg-zinc-600 p-2 rounded-full touch-manipulation"
                  aria-label="Next month"
                >
                  <ChevronDown size={18} className="rotate-90" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-gray-400 text-xs font-medium py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-1"></div>
                ))}

                {Array.from({ length: daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = selectedDate && 
                    selectedDate.getDate() === day && 
                    selectedDate.getMonth() === currentMonth.getMonth() && 
                    selectedDate.getFullYear() === currentMonth.getFullYear();
                  
                  const dateString = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'MMMM d, yyyy');
                  
                  return (
                    <button
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        "h-7 w-7 rounded-full text-white flex items-center justify-center text-sm touch-manipulation",
                        isSelected 
                          ? "bg-lime-600 font-bold" 
                          : "hover:bg-zinc-700"
                      )}
                      aria-label={dateString}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-zinc-700 flex justify-end space-x-2">
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-zinc-600 hover:bg-zinc-500 text-white px-3 py-1.5 h-8 text-sm"
                type="button"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-lime-600 hover:bg-lime-700 text-white px-3 py-1.5 h-8 text-sm"
                type="button"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom TimePicker Component
const CustomTimePicker = ({ 
  value = "", 
  onChange, 
  disabled,
  placeholder = "Select time" 
}: { 
  value?: string; 
  onChange: (time: string) => void; 
  disabled?: boolean;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Generate array of times (7 AM to 7 PM)
  const times = [
    "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"
  ];
  
  // Convert display time (e.g., "3:00 PM") to 24-hour format for input value (e.g., "15:00")
  const formatTimeForInput = (displayTime: string): string => {
    const [time, period] = displayTime.split(' ');
    const [hours, minutes] = time.split(':');
    
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };
  
  // Convert 24-hour format (e.g., "15:00") to display time (e.g., "3:00 PM")
  const formatTimeForDisplay = (inputTime: string): string => {
    if (!inputTime) return '';
    
    const [hours, minutes] = inputTime.split(':');
    const hour = parseInt(hours);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${period}`;
  };
  
  // Handle time selection
  const handleTimeSelect = (displayTime: string) => {
    const inputTime = formatTimeForInput(displayTime);
    onChange(inputTime);
    setIsOpen(false);
  };
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="w-full">
      <div 
        className={cn(
          "flex items-center justify-between px-5 py-3 bg-white bg-opacity-10 rounded-md cursor-pointer h-[3.5rem]",
          "border border-transparent hover:border-gray-600 text-white w-full text-lg",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <span className={value ? "text-white" : "text-white text-opacity-50"}>
          {value ? formatTimeForDisplay(value) : placeholder}
        </span>
        <CalendarIcon size={28} className="text-white opacity-70" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div 
            ref={modalRef}
            className="bg-zinc-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Time picker dialog"
          >
            <div className="p-5 bg-zinc-700 flex justify-between items-center">
              <h3 className="text-white text-xl font-semibold">Select Time</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-zinc-600 rounded-full p-3"
                aria-label="Close time picker"
              >
                <X size={32} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {times.map((displayTime) => {
                  const inputTime = formatTimeForInput(displayTime);
                  const isSelected = value === inputTime;
                  
                  return (
                    <button
                      key={displayTime}
                      onClick={() => handleTimeSelect(displayTime)}
                      className={cn(
                        "h-16 rounded-lg text-white flex items-center justify-center text-xl touch-manipulation transition-colors",
                        isSelected 
                          ? "bg-lime-600 font-bold" 
                          : "bg-zinc-700 hover:bg-zinc-600"
                      )}
                      aria-label={`Select ${displayTime}`}
                    >
                      {displayTime}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 bg-zinc-700 flex justify-end space-x-4">
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-zinc-600 hover:bg-zinc-500 text-white px-6 py-3 h-14 text-lg"
                type="button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Success Dialog Component
const SuccessDialog = ({ 
  isOpen, 
  onClose, 
  appointmentDate,
  appointmentTime,
  adjusterName,
  appointmentNotes,
}: { 
  isOpen: boolean;
  onClose: () => void;
  appointmentDate?: string;
  appointmentTime?: string;
  adjusterName?: string;
  appointmentNotes?: string;
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Format appointment date to more readable format
  const formattedDate = appointmentDate ? format(new Date(appointmentDate), 'EEEE, MMM d, yyyy') : '';
  
  // Format appointment time from 24-hour to 12-hour format
  const formatTimeForDisplay = (time?: string): string => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${period}`;
  };
  
  // Format Google Calendar link
  const formatGoogleCalendarLink = () => {
    if (!appointmentDate || !appointmentTime) return '';
    
    // Convert date from YYYY-MM-DD to YYYYMMDD
    const formattedDate = appointmentDate.replace(/-/g, '');
    
    // Convert time from HH:MM to HHMMSS
    const formattedTime = appointmentTime.replace(':', '') + '00';
    
    // Format for Google Calendar
    const startDateTime = `${formattedDate}T${formattedTime}`;
    const endDateTime = `${formattedDate}T${parseInt(formattedTime.substring(0, 2)) + 1}${formattedTime.substring(2)}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Adjuster Appointment')}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(`Adjuster: ${adjusterName || 'TBD'}\nNotes: ${appointmentNotes || 'None'}`)}`;
  };
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div 
        ref={dialogRef}
        className="bg-zinc-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 bg-zinc-700">
          <div className="flex items-center justify-center mb-2">
            <div className="w-16 h-16 bg-lime-600 rounded-full flex items-center justify-center">
              <Check className="h-10 w-10 text-white" />
            </div>
          </div>
          <h3 className="text-white text-2xl font-bold text-center mb-2">Great work, it's scheduled!</h3>
          <p className="text-gray-300 text-center mb-4">
            Your appointment has been successfully scheduled for:
          </p>
          <div className="bg-zinc-800 rounded-lg p-4 mb-6">
            <p className="text-white text-lg text-center font-semibold">{formattedDate}</p>
            <p className="text-white text-lg text-center font-semibold">{formatTimeForDisplay(appointmentTime)}</p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <a 
            href={formatGoogleCalendarLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white h-[3.5rem] rounded-md text-lg transition-colors w-full"
          >
            <CalendarIcon size={20} className="mr-2 h-5 w-5" />
            Add to Google Calendar
          </a>
          
          <Button 
            onClick={onClose}
            className="w-full h-[3.5rem] text-lg"
            variant="outline"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Fullscreen Modal for Calendar with custom calendar styling
const FullscreenCalendarModal = ({ 
  isOpen, 
  onClose,
  children
}: { 
  isOpen: boolean; 
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      
      // Add custom calendar styling
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        /* Calendar styling overrides */
        .day-cell {
          min-height: 120px !important;
          background-color: rgba(30, 41, 59, 0.4) !important;
          border: 1px solid rgba(148, 163, 184, 0.1) !important;
          border-radius: 8px !important;
          margin: 4px !important;
          transition: all 0.2s ease-in-out !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        
        .day-cell:hover {
          background-color: rgba(30, 41, 59, 0.6) !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          transform: translateY(-2px) !important;
          border-color: rgba(132, 204, 22, 0.4) !important;
        }
        
        .day-cell.selected, .day-cell.today {
          border: 2px solid rgb(132, 204, 22) !important;
          box-shadow: 0 0 0 2px rgba(132, 204, 22, 0.3) !important;
        }
        
        .calendar-content {
          background-color: #1e293b !important;
          padding: 16px !important;
          border-radius: 12px !important;
        }
        
        .calendar-header {
          margin-bottom: 16px !important;
          border-bottom: 2px solid rgba(132, 204, 22, 0.3) !important;
          padding-bottom: 12px !important;
        }
        
        .calendar-header button {
          color: white !important;
          background-color: rgba(30, 41, 59, 0.8) !important;
          border: 1px solid rgba(132, 204, 22, 0.3) !important;
        }
        
        .calendar-header button:hover {
          background-color: rgba(132, 204, 22, 0.2) !important;
        }
        
        .day-label {
          font-weight: bold !important;
          color: rgba(255, 255, 255, 0.8) !important;
          font-size: 16px !important;
          padding: 8px !important;
          background-color: rgba(132, 204, 22, 0.1) !important;
          border-radius: 6px !important;
          margin-bottom: 8px !important;
        }
        
        .day-number {
          font-size: 18px !important;
          font-weight: bold !important;
          color: white !important;
          margin: 4px !important;
        }
        
        .appointment {
          border-left: 3px solid rgb(132, 204, 22) !important;
          background-color: rgba(132, 204, 22, 0.1) !important;
          margin: 4px 0 !important;
          padding: 6px !important;
          border-radius: 4px !important;
          transition: all 0.2s ease !important;
        }
        
        .appointment:hover {
          background-color: rgba(132, 204, 22, 0.2) !important;
          transform: translateX(2px) !important;
        }
        
        /* Style for the tabs */
        .calendar-tabs {
          background-color: rgba(30, 41, 59, 0.8) !important;
          border: 1px solid rgba(132, 204, 22, 0.2) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        
        .calendar-tab-active {
          background-color: rgba(132, 204, 22, 0.2) !important;
          color: white !important;
          font-weight: bold !important;
        }
      `;
      document.head.appendChild(styleElement);
      
      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.body.style.overflow = '';
        document.head.removeChild(styleElement);
      };
    }
    
    return undefined;
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] bg-black bg-opacity-80 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className="w-full h-full max-w-7xl max-h-[95vh] bg-slate-800 rounded-lg overflow-hidden flex flex-col relative"
      >
        <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-lime-800">
          <h2 className="text-white text-xl font-bold flex items-center">
            <CalendarIcon className="mr-2 h-6 w-6 text-lime-500" />
            <span>Appointments Calendar</span>
          </h2>
          <Button 
            onClick={onClose}
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-slate-700"
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-900">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Form schema based on Prisma Lead model fields
const adjusterFormSchema = z.object({
  insuranceAdjusterName: z.string().optional().or(z.literal("")),
  insuranceAdjusterPhone: z.string().optional().or(z.literal("")),
  insuranceAdjusterEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  adjusterAppointmentNotes: z.string().optional().or(z.literal("")),
  adjusterAppointmentDate: z.string().optional().or(z.literal("")),
  adjusterAppointmentTime: z.string().optional().or(z.literal(""))
})

type AdjusterFormValues = z.infer<typeof adjusterFormSchema>

interface AdjusterFormProps {
  leadId: string
  initialData?: Partial<AdjusterFormValues>
  onSuccess?: () => void
  onCancel?: () => void
  isReadOnly?: boolean
}

// Helper to transform CalendarAppointment to RawGCalEvent for the Calendar component
function calendarAppointmentToRawGCalEvent(appointment: CalendarAppointment): RawGCalEvent {
  const startDateTime = appointment.date ? new Date(appointment.date) : new Date();
  if (appointment.startTime) {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);
  }

  let endDateTime: Date | undefined = undefined;
  if (appointment.endTime && appointment.date) {
    endDateTime = new Date(appointment.date);
    const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);
    if (endDateTime < startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
    }
  } else {
    endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
  }

  return {
    id: appointment.id,
    summary: appointment.title,
    start: { dateTime: startDateTime.toISOString() },
    end: { dateTime: endDateTime.toISOString() },
    extendedProperties: {
      private: {
        leadId: appointment.leadId,
        leadName: appointment.leadName,
        purpose: appointment.purpose as string, // Cast to string if your RawGCalEvent expects string here
        status: appointment.status as string, // Cast to string if your RawGCalEvent expects string here
      },
    },
    location: appointment.address,
    description: appointment.notes,
  };
}

export function AdjusterForm({
  leadId,
  initialData = {},
  onSuccess,
  onCancel,
  isReadOnly = false
}: AdjusterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarView, setCalendarView] = useState<"month" | "day">("month")
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(mockAppointments)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState<Error | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const storageKey = `draft-lead-adjuster-${leadId}`
  const { toast } = useToast()
  
  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AdjusterFormValues>({
    resolver: zodResolver(adjusterFormSchema),
    defaultValues: initialData
  });

  // Watch all form values
  const watchedValues = watch();

  const onSubmit = async (data: AdjusterFormValues) => {
    try {
      await saveAdjusterInfo();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // --- Draft Loading ---
  useEffect(() => {
    if (!leadId || isReadOnly) return;

    const draft = sessionStorage.getItem(storageKey);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setIsDirty(true);
        console.log("Loaded adjuster draft for lead:", leadId);
      } catch (e) {
        console.error("Failed to parse adjuster draft:", e);
        sessionStorage.removeItem(storageKey);
        setIsDirty(false);
      }
    } else {
      setIsDirty(false);
    }
  }, [leadId, storageKey, isReadOnly]);

  // --- Draft Saving ---
  const saveDraft = useCallback(
    debounce((data: AdjusterFormValues) => {
      if (leadId && isDirty && !isReadOnly) {
        console.log("Saving adjuster draft for lead:", leadId);
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      }
    }, 500),
    [storageKey, leadId, isDirty, isReadOnly]
  );

  useEffect(() => {
    const hasChanged = JSON.stringify(watchedValues) !== JSON.stringify(initialData);
     if(hasChanged && !isDirty) {
       setIsDirty(true);
    }
    if (isDirty) {
      saveDraft(watchedValues);
    }
    return () => {
      saveDraft.cancel();
    };
  }, [watchedValues, saveDraft, isDirty, initialData]);

  const saveAdjusterInfo = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Extract only adjuster info fields
      const adjusterData = {
        insuranceAdjusterName: watchedValues.insuranceAdjusterName,
        insuranceAdjusterPhone: watchedValues.insuranceAdjusterPhone,
        insuranceAdjusterEmail: watchedValues.insuranceAdjusterEmail,
        adjusterAppointmentNotes: watchedValues.adjusterAppointmentNotes
      };

      // Call API route to update adjuster information
      const response = await fetch(`/api/leads/${leadId}/adjuster`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(adjusterData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update adjuster information")
      }

      setSuccessMessage("Adjuster information updated successfully")
      toast({
        title: "Success",
        description: "Adjuster information has been saved",
        variant: "default",
      })
      sessionStorage.removeItem(storageKey); // Clear draft
      setIsDirty(false); // Reset dirty state
      setValue("insuranceAdjusterName", adjusterData.insuranceAdjusterName);
      setValue("insuranceAdjusterPhone", adjusterData.insuranceAdjusterPhone);
      setValue("insuranceAdjusterEmail", adjusterData.insuranceAdjusterEmail);
      setValue("adjusterAppointmentNotes", adjusterData.adjusterAppointmentNotes);
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save adjuster information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveAppointment = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Include both adjuster info and appointment fields
      const adjusterData = {
        insuranceAdjusterName: watchedValues.insuranceAdjusterName,
        insuranceAdjusterPhone: watchedValues.insuranceAdjusterPhone,
        insuranceAdjusterEmail: watchedValues.insuranceAdjusterEmail,
        adjusterAppointmentDate: watchedValues.adjusterAppointmentDate,
        adjusterAppointmentTime: watchedValues.adjusterAppointmentTime,
        adjusterAppointmentNotes: watchedValues.adjusterAppointmentNotes
      };

      // 1. Call API route to update adjuster information on the lead
      const response = await fetch(`/api/leads/${leadId}/adjuster`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(adjusterData)
      });

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update adjuster information")
      }

      // 2. Create calendar appointment only if date and time are provided
      if (watchedValues.adjusterAppointmentDate && watchedValues.adjusterAppointmentTime) {
        const appointmentDateStr = watchedValues.adjusterAppointmentDate;
        const timeString = watchedValues.adjusterAppointmentTime;
        
        // Parse the date string and time string properly
        const [year, month, day] = appointmentDateStr.split('-').map(Number);
        const [hours, minutes] = timeString.split(":").map(Number);
        
        // Create proper Date objects
        const startDateTime = new Date(year, month - 1, day, hours, minutes);
        const endDateTime = new Date(year, month - 1, day, hours + 1, minutes);

        // Create calendar appointment
        const calendarResponse = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: `Adjuster Appointment${watchedValues.insuranceAdjusterName ? ` with ${watchedValues.insuranceAdjusterName}` : ''}`,
            description: `Adjuster: ${watchedValues.insuranceAdjusterName || 'TBD'}\nPhone: ${watchedValues.insuranceAdjusterPhone || 'N/A'}\nEmail: ${watchedValues.insuranceAdjusterEmail || 'N/A'}\n\nNotes: ${watchedValues.adjusterAppointmentNotes || 'None'}`,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            purpose: 'ADJUSTER',
            status: 'SCHEDULED',
            leadId: leadId,
            location: '' // Add location if available
          })
        });

        if (!calendarResponse.ok) {
          const errorData = await calendarResponse.json();
          throw new Error(errorData.message || "Failed to create calendar event");
        }

        toast({
          title: "Appointment Scheduled",
          description: `Adjuster appointment scheduled for ${format(startDateTime, "MMM d, yyyy 'at' h:mm a")}`,
          variant: "default",
        })
      }

      setSuccessMessage("Adjuster information updated successfully")
      setShowSuccessDialog(true)
      
      // Clear any draft data
      sessionStorage.removeItem(storageKey);
      setIsDirty(false);
      
      // Call onSuccess callback
      onSuccess?.()
    } catch (err) {
      console.error('Error saving adjuster information:', err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to schedule appointment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calendar handlers
  const handleDateClick = (date: Date) => {
    console.log("Date clicked:", date);
  };

  const handleAppointmentClick = (appointment: CalendarAppointment) => {
    console.log("Appointment clicked:", appointment);
  };

  const handleSwitchToDay = (date: Date, time?: string) => {
    console.log("Switch to day view for:", date, "at time:", time);
    // Potentially close modal and open a form for this specific day/time
    // setIsCalendarModalOpen(false);
    // set some state to open appointment form with this date/time
  };

  // --- Discard Draft ---
  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard unsaved changes?")) {
      sessionStorage.removeItem(storageKey);
      setIsDirty(false);
      console.log("Discarded adjuster draft for lead:", leadId);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full relative p-1">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="absolute top-0 right-0 text-white hover:text-gray-300 h-8 w-8 mt-1 mr-1 z-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        )}

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="insuranceAdjusterName" className="text-white text-opacity-90 text-sm sm:text-base">
            Adjuster Name
          </Label>
          <Input
            id="insuranceAdjusterName"
            placeholder="Adjuster's full name"
            {...register("insuranceAdjusterName")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
          />
          {errors.insuranceAdjusterName && (
            <p className="text-red-400 text-xs mt-1">{errors.insuranceAdjusterName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="insuranceAdjusterPhone" className="text-white text-opacity-90 text-sm sm:text-base">
              Adjuster Phone
            </Label>
            <Input
              id="insuranceAdjusterPhone"
              placeholder="Adjuster's phone number"
              {...register("insuranceAdjusterPhone")}
              disabled={isLoading || isReadOnly}
              className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="insuranceAdjusterEmail" className="text-white text-opacity-90 text-sm sm:text-base">
              Adjuster Email
            </Label>
            <Input
              id="insuranceAdjusterEmail"
              type="email"
              placeholder="Adjuster's email address"
              {...register("insuranceAdjusterEmail")}
              disabled={isLoading || isReadOnly}
              className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="adjusterAppointmentDate" className="text-white text-opacity-90 text-sm sm:text-base">
              Appointment Date & Time
            </Label>
            <Button
              type="button"
              onClick={() => setShowCalendar(true)}
              variant="ghost"
              className="text-white text-opacity-80 hover:text-opacity-100 px-2 py-1 h-auto text-xs sm:text-sm"
            >
              <CalendarIcon size={20} className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              View Calendar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Controller
              name="adjusterAppointmentDate"
              control={control}
              render={({ field }) => (
                <CustomDatePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading || isReadOnly}
                  placeholder="Select date"
                />
              )}
            />
            <Controller
              name="adjusterAppointmentTime"
              control={control}
              render={({ field }) => (
                <CustomTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading || isReadOnly}
                  placeholder="Select time"
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="adjusterAppointmentNotes" className="text-white text-opacity-90 text-sm sm:text-base">
            Appointment Notes
          </Label>
          <textarea
            id="adjusterAppointmentNotes"
            placeholder="Enter any notes or instructions for the adjuster appointment"
            {...register("adjusterAppointmentNotes")}
            disabled={isLoading || isReadOnly}
            rows={isMobile ? 3 : 5}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 w-full p-3 rounded-md text-sm sm:text-base"
          />
        </div>

        {!isReadOnly && (
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                type="button" 
                onClick={saveAdjusterInfo}
                disabled={isLoading}
                className="bg-zinc-700 hover:bg-zinc-600 text-white h-10 sm:h-12 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Info"
                )}
              </Button>
              
              <Button 
                type="button" 
                onClick={saveAppointment}
                disabled={isLoading || !watch("adjusterAppointmentDate") || !watch("adjusterAppointmentTime")}
                className="bg-lime-600 hover:bg-lime-700 text-white h-10 sm:h-12 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Appointment"
                )}
              </Button>
            </div>
            
            {error && (
              <div className="mt-3 text-red-400 text-sm p-3 bg-red-900 bg-opacity-25 rounded">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="mt-3 text-green-400 text-sm p-3 bg-green-900 bg-opacity-25 rounded">
                {successMessage}
              </div>
            )}
          </div>
        )}

        {/* Success Dialog */}
        <SuccessDialog
          isOpen={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          appointmentDate={watch("adjusterAppointmentDate")}
          appointmentTime={watch("adjusterAppointmentTime")}
          adjusterName={watch("insuranceAdjusterName")}
          appointmentNotes={watch("adjusterAppointmentNotes")}
        />

        {/* Fullscreen Calendar Modal */}
        <FullscreenCalendarModal isOpen={isCalendarModalOpen} onClose={() => setIsCalendarModalOpen(false)}>
          <Calendar
            appointmentsData={{
              appointments: appointments.map(calendarAppointmentToRawGCalEvent),
              isLoading: calendarLoading,
              error: calendarError,
            }}
            onDateClick={handleDateClick}
            onAppointmentClick={(rawEvent: RawGCalEvent) => {
              // If handleAppointmentClick needs CalendarAppointment, we need to find the original or transform back
              // For now, let's find the original CalendarAppointment from our state
              const originalAppointment = appointments.find(app => app.id === rawEvent.id);
              if (originalAppointment) {
                handleAppointmentClick(originalAppointment);
              } else {
                console.warn("Could not find original appointment for raw event:", rawEvent);
                // Potentially create a new CalendarAppointment from RawGCalEvent if needed for the form
              }
            }}
            onSwitchToDay={handleSwitchToDay}
          />
        </FullscreenCalendarModal>
      </form>
    </>
  );
} 