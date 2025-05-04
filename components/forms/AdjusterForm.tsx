"use client"

import React, { useState, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, ChevronUp, Check, Calendar as CalendarIcon, X, Clock, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { createPortal } from "react-dom"
import { Calendar } from "@/components/appointments/calendar" 
import type { CalendarAppointment } from "@/types/appointments"
import { AppointmentPurposeEnum } from '@/types/appointments'

// Mock data for appointments (can be replaced with real data fetching)
const mockAppointments: CalendarAppointment[] = [
  {
    id: "1",
    title: "Initial Roof Assessment",
    date: new Date(2023, 6, 25, 10, 30),
    startTime: "10:30 AM",
    endTime: "11:30 AM",
    purpose: AppointmentPurposeEnum.INITIAL_CONSULTATION,
    status: "scheduled",
    leadId: "1",
    leadName: "John Smith",
    address: "123 Main St, Anytown",
    notes: "Check for hail damage on north side of roof",
  },
  {
    id: "2",
    title: "Adjuster Meeting",
    date: new Date(),  // Today
    startTime: "2:00 PM",
    endTime: "3:00 PM",
    purpose: AppointmentPurposeEnum.OTHER,
    status: "scheduled",
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
        <CalendarIcon size={16} className="text-white opacity-70" />
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
        <Clock size={28} className="text-white opacity-70" />
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
            <CalendarIcon className="mr-2 h-5 w-5" />
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
            <CalendarDays className="mr-2 h-6 w-6 text-lime-500" />
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
  isReadOnly?: boolean
}

export function AdjusterForm({
  leadId,
  initialData = {},
  onSuccess,
  isReadOnly = false
}: AdjusterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarView, setCalendarView] = useState<"month" | "day">("month")
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  // Get appointments for the current month
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(mockAppointments)
  const [isMobile, setIsMobile] = useState(false)
  
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
    formState: { errors },
    control,
    reset,
    getValues,
    watch,
    setValue
  } = useForm<AdjusterFormValues>({
    resolver: zodResolver(adjusterFormSchema),
    defaultValues: initialData
  })

  const saveAdjusterInfo = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Extract only adjuster info fields
      const adjusterData = {
        insuranceAdjusterName: getValues("insuranceAdjusterName"),
        insuranceAdjusterPhone: getValues("insuranceAdjusterPhone"),
        insuranceAdjusterEmail: getValues("insuranceAdjusterEmail"),
        adjusterAppointmentNotes: getValues("adjusterAppointmentNotes")
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
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const saveAppointment = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Extract only appointment fields
      const appointmentData = {
        adjusterAppointmentDate: getValues("adjusterAppointmentDate"),
        adjusterAppointmentTime: getValues("adjusterAppointmentTime")
      };

      // 1. Call API route to update appointment information on the lead
      const response = await fetch(`/api/leads/${leadId}/appointment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update appointment information")
      }

      // 2. Also create an entry in the appointment calendar system
      const appointmentDateStr = getValues("adjusterAppointmentDate");
      if (!appointmentDateStr) {
        console.error("Cannot create calendar appointment: Missing appointment date");
        setSuccessMessage("Appointment information updated successfully, but calendar entry could not be created");
        setShowSuccessDialog(true);
        onSuccess?.();
        return;
      }

      const appointmentDate = new Date(appointmentDateStr);
      
      // Parse time (HH:MM format) to get hours and minutes
      const timeString = getValues("adjusterAppointmentTime") || "12:00";
      const [hours, minutes] = timeString.split(":").map(num => parseInt(num));
      
      // Set the hours and minutes on the appointment date
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time (1 hour after start time)
      const endDate = new Date(appointmentDate);
      endDate.setHours(endDate.getHours() + 1);
      
      // Format time strings for display
      const formatTimeString = (date: Date) => {
        const hour = date.getHours();
        const minute = date.getMinutes();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
      };
      
      const startTimeString = formatTimeString(appointmentDate);
      const endTimeString = formatTimeString(endDate);
      
      // Create calendar appointment object
      const calendarAppointment = {
        title: "Adjuster Appointment",
        date: appointmentDate.toISOString(),
        startTime: startTimeString,
        endTime: endTimeString,
        purpose: AppointmentPurposeEnum.OTHER,
        status: "scheduled",
        leadId: leadId,
        leadName: `${getValues("insuranceAdjusterName") || "Adjuster"} Meeting`,
        address: "", // We don't have this info in the form
        notes: getValues("adjusterAppointmentNotes") || "",
      };
      
      // Call API to create calendar appointment
      const calendarResponse = await fetch(`/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(calendarAppointment)
      });
      
      if (!calendarResponse.ok) {
        // We'll still consider the appointment saved, but log an error about calendar
        console.error("Failed to add appointment to calendar system:", await calendarResponse.text());
      }

      setSuccessMessage("Appointment information updated successfully")
      // Show success dialog
      setShowSuccessDialog(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
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
    console.log("Switch to day:", date, "time:", time);
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
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
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
      <FullscreenCalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-4 bg-zinc-800">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-1">
              {calendarView === "month" ? "Appointments Calendar" : (
                selectedDayDate ? format(selectedDayDate, "EEEE, MMMM d, yyyy") : "Daily Schedule"
              )}
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mb-4">
              {calendarView === "month" 
                ? "Click on a day to view appointments" 
                : "Click on an available time slot to select it"}
            </p>
            
            {calendarView === "month" ? (
              <Calendar 
                appointments={appointments}
                onDateClick={handleDateClick}
                onAppointmentClick={handleAppointmentClick}
                onSwitchToDay={handleSwitchToDay}
              />
            ) : (
              <div>
                <button
                  onClick={() => setCalendarView("month")}
                  className="mb-4 px-3 py-2 bg-zinc-700 text-white rounded-md text-sm flex items-center"
                >
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Back to Calendar
                </button>
                
                <div className="bg-zinc-900 rounded-lg p-3 sm:p-4 mb-6">
                  <h3 className="font-medium text-base sm:text-lg text-white mb-2">Appointments on this day:</h3>
                  {appointments.filter(apt => 
                    selectedDayDate && 
                    apt.date?.getDate() === selectedDayDate.getDate() &&
                    apt.date?.getMonth() === selectedDayDate.getMonth() &&
                    apt.date?.getFullYear() === selectedDayDate.getFullYear()
                  ).length > 0 ? (
                    <div className="space-y-2">
                      {appointments.filter(apt => 
                        selectedDayDate && 
                        apt.date?.getDate() === selectedDayDate.getDate() &&
                        apt.date?.getMonth() === selectedDayDate.getMonth() &&
                        apt.date?.getFullYear() === selectedDayDate.getFullYear()
                      ).map(apt => (
                        <div 
                          key={apt.id} 
                          className="bg-zinc-800 p-3 rounded-md border border-zinc-700"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-white">{apt.title}</p>
                              <p className="text-sm text-gray-300">{apt.startTime} - {apt.endTime}</p>
                            </div>
                            <div className="px-2 py-1 bg-blue-900 text-blue-200 rounded-md text-xs">
                              {apt.purpose}
                            </div>
                          </div>
                          {apt.notes && (
                            <p className="text-sm text-gray-400 mt-2">{apt.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No appointments scheduled</p>
                  )}
                </div>
                
                <div className="bg-zinc-900 rounded-lg p-3 sm:p-4">
                  <h3 className="font-medium text-base sm:text-lg text-white mb-3">Available Time Slots:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"].map(time => {
                      // Check if this time slot is already booked
                      const isBooked = Boolean(selectedDayDate && appointments.some(apt => 
                        apt.date?.getDate() === selectedDayDate.getDate() &&
                        apt.date?.getMonth() === selectedDayDate.getMonth() &&
                        apt.date?.getFullYear() === selectedDayDate.getFullYear() &&
                        apt.startTime === time
                      ));
                      
                      return (
                        <button
                          key={time}
                          onClick={() => {
                            if (!isBooked && selectedDayDate) {
                              setValue("adjusterAppointmentDate", format(selectedDayDate, 'yyyy-MM-dd'));
                              setValue("adjusterAppointmentTime", time);
                              setShowCalendar(false);
                            }
                          }}
                          className={cn(
                            "py-2 px-3 rounded-md text-white text-sm sm:text-base text-center",
                            isBooked 
                              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" 
                              : "bg-zinc-800 hover:bg-lime-900 active:bg-lime-800 cursor-pointer"
                          )}
                          disabled={isBooked as boolean}
                        >
                          {time}
                          {isBooked && <span className="block text-xs text-red-400">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </FullscreenCalendarModal>
    </div>
  );
} 