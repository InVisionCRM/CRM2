"use client"

import { useState, useMemo, useRef } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { format, addHours, parseISO, formatDistanceToNow } from "date-fns"
import type { LeadSummary } from "@/types/dashboard"
import { MapPin, Clock, Eye, Plus, Building2, ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRight, ChevronDown, ChevronUp, UserCircle, Upload, Loader2, CheckCircle2, Trash2, Send, DollarSign, CalendarPlus, ChevronDownIcon, ExternalLink, FileText, Camera, NotebookPen, FileSignature, PenTool, Shield, User, Mail, Phone, Calendar as CalendarIcon, CalendarDays, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { LeadStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { InlineEditDialog } from "@/components/leads/inline-edit-dialog"
import { StreetViewTooltip } from "@/components/leads/street-view-tooltip"
import { StreetViewImage } from "@/components/map/street-view-image"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LeadFiles } from "@/components/leads/lead-files"
import { LeadPhotosTab } from "@/components/leads/tabs/LeadPhotosTab"

interface LeadsListProps {
  leads: LeadSummary[]
  isLoading?: boolean
  assignedTo?: string | null
  onViewActivity: (lead: LeadSummary) => void
  onViewFiles: (lead: LeadSummary) => void
}

interface EventCreationData {
  type: 'adjuster' | 'build' | 'acv' | 'rcv'
  label: string
  title: string
  description: string
  icon: React.ReactNode
}

interface CalendarEvent {
  start?: {
    dateTime?: string
    date?: string
  }
  htmlLink?: string
  [key: string]: unknown
}

interface QuickActionButtonProps {
  onClick?: () => void;
  href?: string;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'contract' | 'sign';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ onClick, href, label, disabled, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'contract':
        return "bg-gradient-to-b from-blue-600/40 via-blue-500/30 to-blue-400/20 border-l border-blue-400 hover:from-blue-500/50 hover:via-blue-400/40 hover:to-blue-300/30";
      case 'sign':
        return "bg-gradient-to-b from-purple-600/40 via-purple-500/30 to-purple-400/20 border-l border-purple-400 hover:from-purple-500/50 hover:via-purple-400/40 hover:to-purple-300/30";
      default:
        return "bg-gradient-to-b from-black/40 via-black/30 via-black/20 to-lime-500/30 border-l border-lime-500 hover:from-slate-800/30 hover:via-slate-800/20 hover:to-lime-500/30";
    }
  };

  const getIcon = () => {
    if (label.includes('Send Contract') || label.includes('Sending')) {
      return <Send className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Sign Contract') || label.includes('Creating')) {
      return <PenTool className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Add Note')) {
      return <NotebookPen className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Photos')) {
      return <Camera className="h-4 w-4 mr-1" />;
    }
    if (label.includes('File Manager')) {
      return <FileText className="h-4 w-4 mr-1" />;
    }
    return null;
  };

  const commonProps = {
    className: cn(
      "relative flex h-16 flex-1 items-center justify-center backdrop-blur-lg p-1 text-sm font-bold text-white",
      "first:border-l-0 transition-all duration-200",
      getVariantStyles(),
      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
    ),
  };

  const Tag = href && !onClick ? 'a' : 'button';
  const tagProps = {
    ...commonProps,
    ...(href && !onClick ? { href: disabled ? undefined : href, target: "_blank", rel: "noopener noreferrer" } : { onClick, type: "button" as const, disabled }),
  };

  return (
    <Tag {...tagProps}>
      <div className="flex flex-col items-center justify-center gap-1">
        {getIcon()}
        <span className="text-xs leading-tight">{label}</span>
      </div>
    </Tag>
  );
};

// Helper function for string truncation
const truncateString = (str: string | null | undefined, num: number): string => {
  if (!str) return "N/A";
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + "...";
};

// Helper function to parse address and return only street address and city
const parseAddressStreetAndCity = (fullAddress: string | null | undefined): string => {
  if (!fullAddress) return "No address available";
  
  // Split by comma and take first two parts (street address, city)
  const parts = fullAddress.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    // Return street address and city only
    return `${parts[0]}, ${parts[1]}`;
  }
  
  // If less than 2 parts, return the full address
  return fullAddress;
};

const getStatusColorClasses = (status: LeadStatus | undefined): string => {
  if (!status) return "bg-gray-200 text-gray-700"
  switch (status) {
    case LeadStatus.signed_contract:
      return "bg-sky-100 text-sky-700 border border-sky-300"
    case LeadStatus.scheduled:
      return "bg-blue-100 text-blue-700 border border-blue-300"
    case LeadStatus.colors:
      return "bg-indigo-100 text-indigo-700 border border-indigo-300"
    case LeadStatus.acv:
      return "bg-purple-100 text-purple-700 border border-purple-300"
    case LeadStatus.job:
      return "bg-amber-100 text-amber-700 border border-amber-300"
    case LeadStatus.completed_jobs:
      return "bg-emerald-100 text-emerald-700 border border-emerald-300"
    case LeadStatus.zero_balance:
      return "bg-green-100 text-green-700 border border-green-300"
    case LeadStatus.denied:
      return "bg-red-100 text-red-700 border border-red-300"
    case LeadStatus.follow_ups:
      return "bg-yellow-100 text-yellow-700 border border-yellow-300"
    default:
      return "bg-gray-100 text-gray-600 border border-gray-300"
  }
}

// Helper to get Google Maps URL for navigation
const getGoogleMapsUrl = (address: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Helper to format dates consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
};

// Helper to get salesperson initials for avatar
const getSalespersonInitials = (name: string | null | undefined): string => {
  if (!name) return "UN";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper to get coordinates from address
const getCoordinatesFromAddress = async (address: string): Promise<[number, number] | null> => {
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return [location.lng, location.lat];
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

export function LeadsList({ leads, isLoading = false, assignedTo: _assignedTo, onViewActivity: _onViewActivity, onViewFiles: _onViewFiles }: LeadsListProps) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [editDialogState, setEditDialogState] = useState<{
    isOpen: boolean;
    leadId: string;
    field: "claimNumber" | "address" | "insuranceCompany" | "insurancePhone" | "adjusterName" | "adjusterPhone" | "adjusterEmail";
  }>({
    isOpen: false,
    leadId: "",
    field: "claimNumber"
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Upload states
  const [uploadedFileStatus, setUploadedFileStatus] = useState<Record<string, Record<string, boolean>>>({});
  const [isUploadingFile, setIsUploadingFile] = useState<Record<string, Record<string, boolean>>>({});
  const [uploadedFileUrls, setUploadedFileUrls] = useState<Record<string, Record<string, string>>>({});
  const [isDeletingFile, setIsDeletingFile] = useState<Record<string, Record<string, boolean>>>({});
  const [currentUploadType, setCurrentUploadType] = useState<string | null>(null);
  const [currentUploadLeadId, setCurrentUploadLeadId] = useState<string | null>(null);
  
  // Street view state
  const [streetViewCoordinates, setStreetViewCoordinates] = useState<Record<string, [number, number] | null>>({});
  
  // Quick notes state
  const [quickNotes, setQuickNotes] = useState<Record<string, string>>({});
  const [isSavingNote, setIsSavingNote] = useState<Record<string, boolean>>({});
  
  // Event creation state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventCreationData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [currentEventLeadId, setCurrentEventLeadId] = useState<string | null>(null);
  const [scheduledEvents, setScheduledEvents] = useState<Record<string, Record<string, CalendarEvent[]>>>({});
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // Quick action dialogs state
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [currentQuickActionLeadId, setCurrentQuickActionLeadId] = useState<string | null>(null);
  const [isSendingContract, setIsSendingContract] = useState<Record<string, boolean>>({});
  const [isSigningInPerson, setIsSigningInPerson] = useState<Record<string, boolean>>({});
  
  // File input refs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Calculate pagination
  const totalLeads = leads.length;
  const totalPages = Math.ceil(totalLeads / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentLeads = useMemo(() => leads.slice(startIndex, endIndex), [leads, startIndex, endIndex]);

  // Upload file types
  const uploadFileTypes = [
    { key: "contract", label: "Contract" },
    { key: "estimate", label: "Estimate" },
    { key: "acv", label: "ACV" },
    { key: "supplement", label: "Supplement" },
    { key: "eagleview", label: "EagleView" },
    { key: "scope_of_work", label: "SOW" },
    { key: "warranty", label: "Warranty" }
  ];

  // Contract upload type (separate)
  const contractUploadType = { key: "contract", label: "Contract" };
  
  // Other document types
  const documentUploadTypes = [
    { key: "estimate", label: "Estimate" },
    { key: "acv", label: "ACV" },
    { key: "supplement", label: "Supplement" },
    { key: "eagleview", label: "EagleView" },
    { key: "scope_of_work", label: "SOW" },
    { key: "warranty", label: "Warranty" }
  ];

  // Reset to first page when page size changes
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const toggleRowExpansion = async (leadId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
      // Load street view coordinates if not already loaded
      const lead = leads.find(l => l.id === leadId);
      if (lead?.address && !streetViewCoordinates[leadId]) {
        const coordinates = await getCoordinatesFromAddress(lead.address);
        if (coordinates) {
          setStreetViewCoordinates(prev => ({ ...prev, [leadId]: coordinates }));
        }
      }
      // Fetch scheduled events for this lead
      await fetchScheduledEventsForLead(leadId);
    }
    setExpandedRows(newExpanded);
  };

  const handleUploadFile = (leadId: string, fileType: string) => {
    const inputRef = fileInputRefs.current[`${leadId}-${fileType}`];
    if (inputRef) {
      inputRef.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, leadId: string, fileType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(prev => ({
      ...prev,
      [leadId]: { ...prev[leadId], [fileType]: true }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', leadId);
      formData.append('fileType', fileType);

      const response = await fetch('/api/files/upload-to-shared-drive', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFileStatus(prev => ({
          ...prev,
          [leadId]: { ...prev[leadId], [fileType]: true }
        }));
        
        if (result.file?.webViewLink) {
          setUploadedFileUrls(prev => ({
            ...prev,
            [leadId]: { ...prev[leadId], [fileType]: result.file.webViewLink }
          }));
        }

        toast({
          title: "Success",
          description: `${fileType} uploaded successfully!`,
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: `Failed to upload ${fileType}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUploadingFile(prev => ({
        ...prev,
        [leadId]: { ...prev[leadId], [fileType]: false }
      }));
      event.target.value = "";
    }
  };

  const handleDeleteFile = async (leadId: string, fileType: string) => {
    setIsDeletingFile(prev => ({
      ...prev,
      [leadId]: { ...prev[leadId], [fileType]: true }
    }));

    try {
      const response = await fetch('/api/files/delete-from-shared-drive', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, fileType }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFileStatus(prev => ({
          ...prev,
          [leadId]: { ...prev[leadId], [fileType]: false }
        }));
        
        setUploadedFileUrls(prev => ({
          ...prev,
          [leadId]: { ...prev[leadId], [fileType]: "" }
        }));

        toast({
          title: "Success",
          description: `${fileType} deleted successfully!`,
        });
      } else {
        throw new Error(result.error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: `Failed to delete ${fileType}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsDeletingFile(prev => ({
        ...prev,
        [leadId]: { ...prev[leadId], [fileType]: false }
      }));
    }
  };

  const handleSaveNote = async (leadId: string) => {
    const note = quickNotes[leadId];
    if (!note?.trim()) return;

    setIsSavingNote(prev => ({ ...prev, [leadId]: true }));

    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Note saved successfully!",
        });
        setQuickNotes(prev => ({ ...prev, [leadId]: "" }));
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNote(prev => ({ ...prev, [leadId]: false }));
    }
  };

  const handleOpenEditDialog = (leadId: string, field: "claimNumber" | "address" | "insuranceCompany" | "insurancePhone" | "adjusterName" | "adjusterPhone" | "adjusterEmail") => {
    setEditDialogState({
      leadId,
      field,
      isOpen: true
    })
  };

  const handleCloseEditDialog = () => {
    setEditDialogState(prev => ({ ...prev, isOpen: false }));
  };

  // Fetch scheduled events for a lead
  const fetchScheduledEventsForLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !session?.user?.email) return;

    setIsLoadingEvents(true);
    try {
      const leadName = lead.name;
      const params = new URLSearchParams({
        leadId: leadId,
        leadName: leadName
      });
      
      const response = await fetch(`/api/calendar/lead-events?${params}`);
      if (response.ok) {
        const events = await response.json();
        setScheduledEvents(prev => ({ ...prev, [leadId]: events }));
      } else {
        console.error('Failed to fetch events:', response.status);
      }
    } catch (error) {
      console.error('Error fetching scheduled events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Helper function to get the most recent event for a category
  const getRecentEvent = (events: CalendarEvent[]) => {
    if (!events || events.length === 0) return null;
    
    const sortedEvents = events.sort((a, b) => {
      const dateA = new Date(a.start?.dateTime || a.start?.date || '');
      const dateB = new Date(b.start?.dateTime || b.start?.date || '');
      return dateB.getTime() - dateA.getTime();
    });
    
    return sortedEvents[0];
  };

  // Helper function to format event date for display
  const formatEventDate = (event: CalendarEvent) => {
    if (!event.start) return null;
    
    const dateString = event.start.dateTime || event.start.date;
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      if (event.start.date && !event.start.dateTime) {
        return format(date, "MMM d, yyyy");
      }
      
      return format(date, "MMM d, h:mm a");
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return null;
    }
  };

  const handleEventButtonClick = (eventData: EventCreationData, leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const userEmail = session?.user?.email || "";
    if (!userEmail) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create calendar events",
        variant: "destructive"
      });
      return;
    }

    // Check if there's an existing event for this type
    const leadEvents = scheduledEvents[leadId];
    if (leadEvents && leadEvents[eventData.type]) {
      const recentEvent = getRecentEvent(leadEvents[eventData.type]);
      if (recentEvent && recentEvent.htmlLink) {
        // Open existing event in Google Calendar
        window.open(recentEvent.htmlLink, '_blank', 'noopener,noreferrer');
        toast({
          title: "Opening Event",
          description: `Opening existing ${eventData.label} in Google Calendar`
        });
        return;
      }
    }

    // No existing event, proceed with creation
    const leadName = lead.name;
    const leadAddress = lead.address || "";
    const claimNumber = lead.claimNumber || "";
    const phone = lead.phone || "N/A";
    const email = lead.email || "N/A";
    const insuranceCompany = lead.insuranceCompany || "N/A";

    const eventDataWithLead = {
      ...eventData,
      title: `${eventData.label} - ${leadName}`,
      description: `${eventData.label}\n\nLead: ${leadName}\nAddress: ${leadAddress}\nPhone: ${phone}\nEmail: ${email}\nClaim #: ${claimNumber}\nInsurance: ${insuranceCompany}`
    };

    setSelectedEventType(eventDataWithLead);
    setEventTitle(eventDataWithLead.title);
    setEventDescription(eventDataWithLead.description);
    setSelectedDate(new Date());
    setSelectedTime("09:00");
    setCurrentEventLeadId(leadId);
    setIsEventModalOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!selectedEventType || !selectedDate || !eventTitle || !currentEventLeadId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const lead = leads.find(l => l.id === currentEventLeadId);
    if (!lead) return;

    setIsCreating(true);
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = addHours(startDateTime, 1); // Default 1 hour duration

      const response = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          leadId: currentEventLeadId,
          leadName: lead.name,
          eventType: selectedEventType.type,
          location: lead.address || ""
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Format the time for display
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedUserTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        
        toast({
          title: "✅ Event Created Successfully!",
          description: `${selectedEventType.label} scheduled for ${format(selectedDate, "MMM d")} at ${formattedUserTime}`
        });
        
        // Show Google Calendar link if available
        if (result.eventUrl) {
          setTimeout(() => {
            toast({
              title: "📅 View Event",
              description: "Click to open event in Google Calendar"
            });
          }, 1000);
        }
        
        setIsEventModalOpen(false);
        // Refresh the events for this lead
        await fetchScheduledEventsForLead(currentEventLeadId);
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Create Event",
          description: error.error || "Failed to create calendar event",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create calendar event",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Quick action handlers
  const handleOpenFilesDialog = (leadId: string) => {
    setCurrentQuickActionLeadId(leadId);
    setFilesDialogOpen(true);
  };

  const handleOpenPhotosDialog = (leadId: string) => {
    setCurrentQuickActionLeadId(leadId);
    setPhotosDialogOpen(true);
  };

  const handleScrollToAddNote = (leadId: string) => {
    // Find the quick notes textarea for this lead and focus it
    const noteTextarea = document.querySelector(`[data-lead-id="${leadId}"] textarea`);
    if (noteTextarea) {
      noteTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (noteTextarea as HTMLTextAreaElement).focus();
    }
  };

  const handleSendContract = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setIsSendingContract(prev => ({ ...prev, [leadId]: true }));

    try {
      const response = await fetch('/api/docuseal/send-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId,
          templateId: 2 // Default to Scope of Work template
        })
      });

      if (response.ok) {
        toast({
          title: "Contract Sent!",
          description: `Contract has been sent to ${lead.email}`
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Send Contract",
          description: error.error || "Failed to send contract",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending contract:', error);
      toast({
        title: "Error",
        description: "Failed to send contract",
        variant: "destructive"
      });
    } finally {
      setIsSendingContract(prev => ({ ...prev, [leadId]: false }));
    }
  };

  const handleSignInPerson = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setIsSigningInPerson(prev => ({ ...prev, [leadId]: true }));

    try {
      const response = await fetch('/api/docuseal/create-in-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId,
          email: lead.email,
          name: lead.name
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.url) {
          window.open(result.url, '_blank');
          toast({
            title: "In-Person Signing Created!",
            description: "Opening signing session in new tab"
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Create Signing Session",
          description: error.error || "Failed to create in-person signing",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating in-person signing:', error);
      toast({
        title: "Error",
        description: "Failed to create in-person signing",
        variant: "destructive"
      });
    } finally {
      setIsSigningInPerson(prev => ({ ...prev, [leadId]: false }));
    }
  };

  if (isLoading) {
    return <p>Loading leads...</p>
  }

  if (leads.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">No leads found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or create a new lead.</p>
      </div>
    )
  }

  const formatStatusLabel = (status: string): string => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-2">
      {currentLeads.map((lead) => {
        const isExpanded = expandedRows.has(lead.id);
        
        return (
          <Card key={lead.id} className="overflow-hidden border border-lime-700 bg-transparent bg-black/50 hover:shadow-md transition-shadow">
            {/* Compact Row */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 bg-black/50"
              onClick={() => toggleRowExpansion(lead.id)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Salesperson Avatar */}
                <div className="flex-shrink-0">
                  {lead.assignedTo ? (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {getSalespersonInitials(lead.assignedTo)}
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">
                      <UserCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Lead Name - Full display without truncation */}
                <div className="flex-1 min-w-0">
                  <Link 
                    href={`/leads/${lead.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-white hover:text-green-400 transition-colors cursor-pointer"
                  >
                    {lead.name || "N/A"}
                  </Link>
                </div>

                {/* Status Badge - Adjusted for better fit */}
                <div className="flex-shrink-0">
                  <span
                    className={cn(
                      "px-2 py-1 inline-flex text-xs leading-3 font-medium rounded-full whitespace-nowrap",
                      getStatusColorClasses(lead.status)
                    )}
                  >
                    {lead.status ? formatStatusLabel(lead.status) : "Unknown"}
                  </span>
                </div>
              </div>

              {/* Actions and Expand */}
              <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                {/* Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-700 bg-gradient-to-b from-green-900/20 via-blue-900/20 to-gray-900 p-4 space-y-4">
                {/* Top Row: Street View and Quick Note */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Street View */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-white flex items-center">
                   
                      
                    </h4>
                    <div className="rounded-lg overflow-hidden bg-gray-800 h-48 border border-gray-700 relative">
                      {lead.address && streetViewCoordinates[lead.id] ? (
                        <StreetViewImage
                          address={lead.address}
                          position={streetViewCoordinates[lead.id]!}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          {lead.address ? "Loading street view..." : "No address available"}
                        </div>
                      )}
                      
                      {/* Location Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <h4 className="font-medium text-white mb-2"></h4>
                        <div className="space-y-1">
                          <div className="flex items-start justify-between">
                            <span className="text-sm text-gray-300"></span>
                            <div className="flex-1 ml-2">
                              {lead.address ? (
                                <StreetViewTooltip address={lead.address}>
                                  <div className="flex items-center cursor-help">
                                    <span className="text-sm text-right text-white" title={lead.address}>
                                      {parseAddressStreetAndCity(lead.address)}
                                    </span>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      title="Open in Google Maps" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(getGoogleMapsUrl(lead.address), "_blank", "noopener,noreferrer");
                                      }}
                                      className="h-6 w-6 text-gray-400 hover:text-green-400 hover:bg-green-900/20 rounded-full ml-1" 
                                    >
                                      <MapPin className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </StreetViewTooltip>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditDialog(lead.id, "address");
                                  }}
                                  className="text-green-400 hover:text-green-300 flex items-center text-sm"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Date Created Overlay - Top Right */}
                      <div className="absolute top-2 right-2 z-10">
                        <div className="h-16 p-2 flex flex-col items-center justify-center gap-0.5 rounded-lg border border-gray-700 bg-black/60 transition-all duration-200 w-28">
                          <div className="flex-shrink-0" style={{ color: '#51D6FF' }}>
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-semibold text-center leading-tight" style={{ color: '#51D6FF' }}>
                            Created
                          </span>
                          <span className="text-xs text-white text-center leading-tight font-semibold">
                            {format(parseISO(lead.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Claim Number Overlay - Top Left */}
                      {lead.claimNumber && (
                        <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-green-500 text-sm font-medium">
                          Claim #: {lead.claimNumber}
                        </div>
                      )}
                    </div>

                    {/* Quick Action Tabs - Moved directly under street view */}
                    <div className="mt-0">
                      <h4 className="text-sm text-white mb-0 text-center"></h4>
                      <div className="flex w-full text-sm text-center border-2 border-white overflow-hidden">
                        <QuickActionButton
                          onClick={() => handleSendContract(lead.id)}
                          label={isSendingContract[lead.id] ? "Sending..." : "Send Contract"}
                          disabled={!lead || isSendingContract[lead.id]}
                          variant="contract"
                        />
                        <QuickActionButton
                          onClick={() => handleSignInPerson(lead.id)}
                          label={isSigningInPerson[lead.id] ? "Creating..." : "Sign Contract"}
                          disabled={!lead || isSigningInPerson[lead.id]}
                          variant="sign"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Note */}
                  <div className="space-y-2 justify-center flex flex-col w-full" data-lead-id={lead.id}>
                    <h4 className="font-medium pt-0 text-white flex items-center">
                     
                      
                    </h4>
                    <div className="relative w-full">
                      <Textarea
                        placeholder="Quick Note..."
                        value={quickNotes[lead.id] || ""}
                        onChange={(e) => setQuickNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                        className="min-h-[20px] w-full resize-none bg-transparent bg-black/60 border-white/20 border-1 text-white placeholder:text-gray-400 focus:border-black/60 focus:ring-green-400/20 pr-20 pb-12"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveNote(lead.id)}
                        disabled={!quickNotes[lead.id]?.trim() || isSavingNote[lead.id]}
                        className="absolute bottom-[2px] right-[2px] bg-green-500/70 hover:bg-green-700 text-white border-1 border-black/60 h-8 px-3"
                      >
                        {isSavingNote[lead.id] ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-2" />
                            Save Note
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Last Activity Section */}
                    {lead.latestActivity && (
                      <div className="mt-3 p-3 bg-black/30 rounded-lg border border-gray-700">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-blue-400">Last Activity</span>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(parseISO(lead.latestActivity.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-white mt-1 line-clamp-2">{lead.latestActivity.title}</p>
                            <span className="text-xs text-gray-400 capitalize">{lead.latestActivity.type}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider between Note and Upload sections */}
                <div className="border-t border-lime-600 border-1"></div>

                {/* Contract Grid */}
                <div className="space-y-1">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="relative group">
                      {!uploadedFileStatus[lead.id]?.[contractUploadType.key] ? (
                        // No contract uploaded - show message and upload button
                        <div className="text-center space-y-1">
                          <div className="text-gray-300 text-sm">
                            
                          </div>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleUploadFile(lead.id, contractUploadType.key)}
                            disabled={isUploadingFile[lead.id]?.[contractUploadType.key]}
                            className="h-20 px-6 text-xl w-full rounded-lg border-gray-700 bg-transparent bg-black/60 text-white hover:bg-gray-800/50 flex items-center justify-center gap-3 transition-all duration-200"
                          >
                            {isUploadingFile[lead.id]?.[contractUploadType.key] ? (
                              <>
                                <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                                <span className="text-lg font-semibold">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-green-400" />
                                <span className="text-lg font-semibold">Upload {contractUploadType.label}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        // Contract uploaded - show uploaded status
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUploadFile(lead.id, contractUploadType.key)}
                          disabled={isUploadingFile[lead.id]?.[contractUploadType.key]}
                          className="h-24 px-2 text-lg w-full rounded-lg border-green-500 bg-green-900/30 text-white hover:bg-gray-800/50 flex items-center justify-center gap-2 transition-all duration-200"
                        >
                          <CheckCircle2 className="h-6 w-6 text-green-400" />
                          <span className="text-base font-semibold">{contractUploadType.label} Uploaded</span>
                        </Button>
                      )}
                      
                      {/* Hover overlay with View and Delete buttons - only show when uploaded */}
                      {uploadedFileStatus[lead.id]?.[contractUploadType.key] && (
                        <div className="absolute inset-0 bg-black/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 z-10">
                          {uploadedFileUrls[lead.id]?.[contractUploadType.key] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(uploadedFileUrls[lead.id][contractUploadType.key], '_blank');
                              }}
                              className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(lead.id, contractUploadType.key);
                            }}
                            disabled={isDeletingFile[lead.id]?.[contractUploadType.key]}
                            className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            {isDeletingFile[lead.id]?.[contractUploadType.key] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {/* Hidden file input */}
                      <input
                        ref={(el) => {
                          if (el) {
                            fileInputRefs.current[`${lead.id}-${contractUploadType.key}`] = el;
                          }
                        }}
                        type="file"
                        onChange={(e) => handleFileChange(e, lead.id, contractUploadType.key)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        aria-label={`Upload ${contractUploadType.label}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Documents Dropdown */}
                <div className="space-y-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-20 px-6 text-xl w-full rounded-lg border-gray-700 bg-transparent bg-black/60 text-white hover:bg-gray-800/50 flex items-center justify-center gap-3 transition-all duration-200"
                      >
                        <Upload className="h-5 w-5 text-green-400" />
                        <span className="text-white font-semibold">Documents</span>
                        <ChevronDown className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-96 bg-gray-800 border-gray-700 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {documentUploadTypes.map(({ key, label }) => (
                          <div key={key} className="relative group">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUploadFile(lead.id, key)}
                              disabled={isUploadingFile[lead.id]?.[key]}
                              className={`h-12 px-2 text-sm w-full rounded-lg border-gray-700 bg-transparent text-white hover:bg-gray-700 flex items-center justify-center gap-1 transition-all duration-200 ${
                                uploadedFileStatus[lead.id]?.[key] ? 'border-green-500 bg-green-900/30' : ''
                              }`}
                            >
                              {isUploadingFile[lead.id]?.[key] ? (
                                <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                              ) : uploadedFileStatus[lead.id]?.[key] ? (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 text-green-400" />
                                  <span className="text-xs font-medium">{label}</span>
                                </>
                              )}
                            </Button>
                            
                            {/* Hover overlay with View and Delete buttons */}
                            {uploadedFileStatus[lead.id]?.[key] && (
                              <div className="absolute inset-0 bg-black/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 z-10">
                                {uploadedFileUrls[lead.id]?.[key] && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(uploadedFileUrls[lead.id][key], '_blank');
                                    }}
                                    className="h-6 px-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(lead.id, key);
                                  }}
                                  disabled={isDeletingFile[lead.id]?.[key]}
                                  className="h-6 px-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  {isDeletingFile[lead.id]?.[key] ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                            
                            {/* Hidden file inputs */}
                            <input
                              ref={(el) => {
                                if (el) {
                                  fileInputRefs.current[`${lead.id}-${key}`] = el;
                                }
                              }}
                              type="file"
                              onChange={(e) => handleFileChange(e, lead.id, key)}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              className="hidden"
                              aria-label={`Upload ${label}`}
                            />
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Lead Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-white border-t border-lime-500/90">
                  {/* Insurance Information */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-lg text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-lime-400" />
                      Insurance
                    </h4>
                    <div className="space-y-3 bg-black/30 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-lime-400" />
                          <span className="text-sm font-medium text-gray-300">Co:</span>
                        </div>
                        {lead.insuranceCompany ? (
                          <span className="text-base font-semibold text-white text-right flex-1 ml-2">
                            {truncateString(lead.insuranceCompany, 20)}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(lead.id, "insuranceCompany");
                            }}
                            className="text-lime-400 hover:text-lime-300 flex items-center text-sm font-medium"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-lime-400" />
                          <span className="text-sm font-medium text-gray-300">Claim #:</span>
                        </div>
                        {lead.claimNumber ? (
                          <span className="text-base font-semibold text-white text-right flex-1 ml-2">
                            {lead.claimNumber}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(lead.id, "claimNumber");
                            }}
                            className="text-lime-400 hover:text-lime-300 flex items-center text-sm font-medium"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-lime-400" />
                          <span className="text-sm font-medium text-gray-300">Phone:</span>
                        </div>
                        {lead.insurancePhone ? (
                          <span className="text-base font-semibold text-white text-right flex-1 ml-2">
                            {truncateString(lead.insurancePhone, 20)}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(lead.id, "insurancePhone");
                            }}
                            className="text-lime-400 hover:text-lime-300 flex items-center text-sm font-medium"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adjuster Information */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-lg text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-lime-400" />
                      Adjuster
                    </h4>
                    <div className="space-y-3 bg-black/30 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-lime-400" />
                          <span className="text-sm font-medium text-gray-300">Name:</span>
                        </div>
                        {lead.insuranceAdjusterName ? (
                          <span className="text-base font-semibold text-white text-right flex-1 ml-2">
                            {truncateString(lead.insuranceAdjusterName, 18)}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(lead.id, "adjusterName");
                            }}
                            className="text-lime-400 hover:text-lime-300 flex items-center text-sm font-medium"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-lime-400" />
                          <span className="text-sm font-medium text-gray-300">Phone:</span>
                        </div>
                        {lead.insuranceAdjusterPhone ? (
                          <span className="text-base font-semibold text-white text-right flex-1 ml-2">
                            {lead.insuranceAdjusterPhone}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(lead.id, "adjusterPhone");
                            }}
                            className="text-lime-400 hover:text-lime-300 flex items-center text-sm font-medium"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-lime-400" />
                          <span className="text-sm font-medium text-gray-300">Email:</span>
                        </div>
                        {lead.insuranceAdjusterEmail ? (
                          <span className="text-base font-semibold text-white text-right flex-1 ml-2">
                            {truncateString(lead.insuranceAdjusterEmail, 20)}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(lead.id, "adjusterEmail");
                            }}
                            className="text-lime-400 hover:text-lime-300 flex items-center text-sm font-medium"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Creation Buttons */}
                <div className="border-t border-lime-500/90 pt-4">
                  <h4 className="font-medium text-white mb-3 text-center">Schedule Events</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        type: 'adjuster' as const,
                        label: "Adjuster Appointment",
                        icon: <Clock className="h-4 w-4" />
                      },
                      {
                        type: 'build' as const,
                        label: "Build Date",
                        icon: <Building2 className="h-4 w-4" />
                      },
                      {
                        type: 'acv' as const,
                        label: "Pick up ACV",
                        icon: <DollarSign className="h-4 w-4" />
                      },
                      {
                        type: 'rcv' as const,
                        label: "Pick up RCV",
                        icon: <DollarSign className="h-4 w-4" />
                      }
                    ].map((eventData, index) => {
                      const leadEvents = scheduledEvents[lead.id];
                      const recentEvent = leadEvents && leadEvents[eventData.type] ? getRecentEvent(leadEvents[eventData.type]) : null;
                      const scheduledDate = recentEvent ? formatEventDate(recentEvent) : null;
                      const hasEvent = !!recentEvent;
                      
                      // Determine border color based on event status
                      let borderClass = "border-gray-700";
                      if (hasEvent) {
                        const eventDate = new Date(recentEvent.start?.dateTime || recentEvent.start?.date || '');
                        const now = new Date();
                        const isPastEvent = eventDate < now;
                        borderClass = isPastEvent ? "border-gray-500 border-2" : "border-lime-500 border-2";
                      }
                      
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => handleEventButtonClick({
                            ...eventData,
                            title: "",
                            description: ""
                          }, lead.id)}
                          className={`h-16 p-2 flex flex-col items-center justify-center gap-1 hover:shadow-md transition-all duration-200 bg-transparent bg-black/60 text-white hover:bg-gray-800/50 ${borderClass}`}
                          disabled={!session?.user?.email || isCreating || isLoadingEvents}
                        >
                          <div className="flex-shrink-0">
                            {eventData.icon}
                          </div>
                          <span className="text-xs font-medium text-center leading-tight px-1">
                            {eventData.label}
                          </span>
                          {scheduledDate && (
                            <span className="text-xs text-white text-center leading-tight mt-0.5 font-semibold">
                              {scheduledDate}
                            </span>
                          )}
                          {!scheduledDate && !isLoadingEvents && (
                            <span className="text-xs text-gray-400 text-center leading-tight mt-0.5">
                              Click to schedule
                            </span>
                          )}
                          {(isCreating || isLoadingEvents) && (
                            <div className="flex items-center gap-1">
                              <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-primary"></div>
                              <span className="text-xs text-muted-foreground">
                                {isCreating ? "Creating..." : "Loading..."}
                              </span>
                            </div>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  {session?.user?.email && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Events will be created in Google Calendar ({session.user.email})
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* Pagination Controls */}
      {totalLeads > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="40">40</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">
              of {totalLeads} leads
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <InlineEditDialog
        leadId={editDialogState.leadId}
        field={editDialogState.field}
        isOpen={editDialogState.isOpen}
        onClose={handleCloseEditDialog}
        onSuccess={() => {
          // You might want to refresh the leads data here
          handleCloseEditDialog();
        }}
      />

      {/* Event Creation Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Schedule {selectedEventType?.label}
            </DialogTitle>
            <DialogDescription>
              Create a calendar event for {currentEventLeadId ? leads.find(l => l.id === currentEventLeadId)?.name : "this lead"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Date & Time</Label>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {selectedDate && selectedTime 
                      ? (() => {
                          const [hours, minutes] = selectedTime.split(':').map(Number)
                          const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
                          const ampm = hours >= 12 ? 'PM' : 'AM'
                          const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'short' })
                          const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
                          return `${dayOfWeek}, ${dateStr} at ${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
                        })()
                      : "Select date & time"
                    }
                    <ChevronDownIcon />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Select Date & Time</DrawerTitle>
                  </DrawerHeader>
                  <div className="flex justify-center pb-4 px-4">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start w-full max-w-3xl">
                      <div className="flex flex-col items-center w-full lg:w-auto">
                        <h3 className="text-sm font-medium mb-3">Date</h3>
                        <div className="scale-90">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => setSelectedDate(date)}
                            disabled={(date: Date) => date < new Date()}
                            classNames={{
                              day_selected: "bg-blue-50 text-white font-medium hover:bg-blue-100 hover:text-black focus:bg-blue-50 focus:text-black"
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center w-full lg:w-auto">
                        <h3 className="text-sm font-medium mb-3">Time</h3>
                        <div className="space-y-3 w-full max-w-xs">
                          <Input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Event description"
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEventModalOpen(false)}
                className="flex-1"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateEvent}
                className="flex-1"
                disabled={isCreating || !selectedDate || !eventTitle}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Files Dialog */}
      <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Files</DialogTitle>
          </DialogHeader>
          {currentQuickActionLeadId && <LeadFiles leadId={currentQuickActionLeadId} />}
        </DialogContent>
      </Dialog>

      {/* Photos Dialog */}
      <Dialog open={photosDialogOpen} onOpenChange={setPhotosDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Photos</DialogTitle>
          </DialogHeader>
          {currentQuickActionLeadId && (
            <LeadPhotosTab 
              leadId={currentQuickActionLeadId}
              claimNumber={leads.find(l => l.id === currentQuickActionLeadId)?.claimNumber || undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
