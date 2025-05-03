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
  disabled,
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
        <span className={selectedDate ? "text-white" : "text-white text-opacity-50"}>
          {selectedDate ? format(selectedDate, 'MM/dd/yyyy') : placeholder}
        </span>
        <CalendarIcon size={28} className="text-white opacity-70" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div 
            ref={modalRef}
            className="bg-zinc-800 rounded-xl shadow-xl w-full max-w-lg sm:max-w-xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Date picker dialog"
          >
            <div className="p-5 bg-zinc-700 flex justify-between items-center">
              <h3 className="text-white text-xl font-semibold">Select Date</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-zinc-600 rounded-full p-3"
                aria-label="Close date picker"
              >
                <X size={32} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={prevMonth}
                  className="text-white bg-zinc-700 hover:bg-zinc-600 p-4 rounded-full touch-manipulation"
                  aria-label="Previous month"
                >
                  <ChevronUp size={36} className="rotate-270" />
                </button>
                <div className="text-white text-2xl font-medium">
                  {`${monthName} ${currentMonth.getFullYear()}`}
                </div>
                <button 
                  onClick={nextMonth}
                  className="text-white bg-zinc-700 hover:bg-zinc-600 p-4 rounded-full touch-manipulation"
                  aria-label="Next month"
                >
                  <ChevronDown size={36} className="rotate-90" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-3">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-gray-400 text-base font-medium py-3">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
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
                        "h-14 w-14 sm:h-16 sm:w-16 rounded-full text-white flex items-center justify-center text-xl touch-manipulation",
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

            <div className="p-5 bg-zinc-700 flex justify-end space-x-4">
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-zinc-600 hover:bg-zinc-500 text-white px-6 py-3 h-14 text-lg"
                type="button"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-3 h-14 text-lg"
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
  const [isLoadingAdjuster, setIsLoadingAdjuster] = useState(false)
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    getValues
  } = useForm<AdjusterFormValues>({
    resolver: zodResolver(adjusterFormSchema),
    defaultValues: initialData
  })

  const saveAdjusterInfo = async () => {
    setIsLoadingAdjuster(true)
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
      setIsLoadingAdjuster(false)
    }
  }

  const saveAppointment = async () => {
    setIsLoadingAppointment(true)
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
      setIsLoadingAppointment(false)
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
    <div className="space-y-6 w-full">
      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          transform: scale(1.5);
          margin-right: 6px;
        }
        
        /* Force larger text sizes on all relevant elements */
        .form-label {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em !important;
        }
        
        input, select, .input-text, .dropdown-text {
          font-size: 1.25rem !important;
        }
        
        input::placeholder {
          font-size: 1.25rem !important;
        }
        
        button.submit-button {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
        }
        
        .section-divider {
          height: 2rem;
        }
        
        .section-title {
          font-size: 1.75rem !important;
          font-weight: 800 !important;
          padding-top: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(163, 230, 53, 0.3);
          margin-bottom: 1.5rem;
          color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
      
      {/* Section 1: Adjuster Information */}
      <div>
        {/* Row 1: Name / Phone */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="insuranceAdjusterName" className="form-label text-white text-opacity-90 text-2xl font-bold">
              Adjuster Name
            </Label>
            <Input
              id="insuranceAdjusterName"
              placeholder="Adjuster's name"
              {...register("insuranceAdjusterName")}
              disabled={isLoadingAdjuster || isReadOnly}
              className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insuranceAdjusterPhone" className="form-label text-white text-opacity-90 text-2xl font-bold">
              Adjuster Phone
            </Label>
            <Input
              id="insuranceAdjusterPhone"
              placeholder="Adjuster's phone"
              {...register("insuranceAdjusterPhone")}
              disabled={isLoadingAdjuster || isReadOnly}
              className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
            />
          </div>
        </div>

        {/* Row 2: Email / Notes */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="insuranceAdjusterEmail" className="form-label text-white text-opacity-90 text-2xl font-bold">
              Adjuster Email
            </Label>
            <Input
              id="insuranceAdjusterEmail"
              type="email"
              placeholder="Adjuster's email"
              {...register("insuranceAdjusterEmail")}
              disabled={isLoadingAdjuster || isReadOnly}
              className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
            />
            {errors.insuranceAdjusterEmail && (
              <p className="text-red-400 text-xs mt-1">{errors.insuranceAdjusterEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjusterAppointmentNotes" className="form-label text-white text-opacity-90 text-2xl font-bold">
              Notes
            </Label>
            <Input
              id="adjusterAppointmentNotes"
              placeholder="Any notes about the adjuster"
              {...register("adjusterAppointmentNotes")}
              disabled={isLoadingAdjuster || isReadOnly}
              className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
            />
          </div>
        </div>

        {/* Row 3: Save Adjuster Info Button */}
        {!isReadOnly && (
          <Button
            type="button"
            onClick={saveAdjusterInfo}
            disabled={isLoadingAdjuster}
            className="submit-button w-full bg-lime-600 hover:bg-lime-700 text-white h-[4rem] mb-8"
          >
            {isLoadingAdjuster ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Adjuster Info"
            )}
          </Button>
        )}

        {/* Row 4: Empty space */}
        <div className="section-divider"></div>

        {/* Row 5: Section Title for Appointment */}
        <h2 className="section-title">Adjuster Appointment</h2>

        {/* Row 6: Date / Time */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="adjusterAppointmentDate" className="form-label text-white text-opacity-90 text-2xl font-bold">
              Appointment Date
            </Label>
            <Controller
              name="adjusterAppointmentDate"
              control={control}
              render={({ field }) => (
                <CustomDatePicker
                  value={field.value}
                  onChange={(date) => field.onChange(date)}
                  disabled={isLoadingAppointment || isReadOnly}
                  placeholder="Select appointment date"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjusterAppointmentTime" className="form-label text-white text-opacity-90 text-2xl font-bold">
              Appointment Time
            </Label>
            <Controller
              name="adjusterAppointmentTime"
              control={control}
              render={({ field }) => (
                <CustomTimePicker
                  value={field.value}
                  onChange={(time) => field.onChange(time)}
                  disabled={isLoadingAppointment || isReadOnly}
                  placeholder="Select appointment time"
                />
              )}
            />
          </div>
        </div>

        {/* Row 7: Empty space */}
        <div className="section-divider"></div>

        {/* Row 8: Save Appointment Button */}
        {!isReadOnly && (
          <Button
            type="button"
            onClick={saveAppointment}
            disabled={isLoadingAppointment}
            className="submit-button w-full bg-lime-600 hover:bg-lime-700 text-white h-[4rem] mb-8"
          >
            {isLoadingAppointment ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Saving Appointment...
              </>
            ) : (
              "Save Appointment"
            )}
          </Button>
        )}

        {/* Row 9: Calendar Links */}
        <div className="grid grid-cols-2 gap-4">
          <a 
            href="https://calendar.google.com/calendar/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white h-[3.5rem] rounded-md text-lg transition-colors"
          >
            <CalendarIcon className="mr-2 h-5 w-5" />
            Google Calendar
          </a>
          
          <Button 
            onClick={() => setShowCalendarModal(true)}
            className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white h-[3.5rem] rounded-md text-lg transition-colors"
          >
            <CalendarDays className="mr-2 h-5 w-5" />
            Calendar View
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-500 bg-opacity-20 p-2 text-red-200 text-sm mt-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded bg-green-500 bg-opacity-20 p-2 text-green-200 text-sm mt-4">
          {successMessage}
        </div>
      )}

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        appointmentDate={getValues("adjusterAppointmentDate")}
        appointmentTime={getValues("adjusterAppointmentTime")}
        adjusterName={getValues("insuranceAdjusterName")}
        appointmentNotes={getValues("adjusterAppointmentNotes")}
      />

      {/* Fullscreen Calendar Modal - Directly using the Calendar component */}
      <FullscreenCalendarModal 
        isOpen={showCalendarModal} 
        onClose={() => setShowCalendarModal(false)}
      >
        <div className="w-full h-full bg-slate-800 rounded-lg overflow-hidden p-2">
          {/* Legend of appointment types */}
          <div className="flex flex-wrap gap-3 mb-4 pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-lime-500"></div>
              <span className="text-white text-sm">Initial Consultation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-white text-sm">Estimate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-white text-sm">Follow Up</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-white text-sm">Inspection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-white text-sm">Contract Signing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-white text-sm">Other</span>
            </div>
          </div>
          
          <Calendar
            appointments={mockAppointments}
            onDateClick={handleDateClick}
            onAppointmentClick={handleAppointmentClick}
            onSwitchToDay={handleSwitchToDay}
          />
        </div>
      </FullscreenCalendarModal>
    </div>
  )
} 