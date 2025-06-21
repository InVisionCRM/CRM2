"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation" // Use next/navigation for App Router
import { LeadStatus } from "@prisma/client"
import { Phone, Mail, CalendarPlus, MapPin, AlertTriangle, CheckCircle2, XIcon, FileText, FileArchive, Image, FileSignature, Copy, Loader2, NotebookPen, PenTool, CheckCircle, CalendarDays, Calendar, Palette, DollarSign, Hammer, ArrowRight, Paintbrush } from "lucide-react" // Added NotebookPen and PenTool icons
import { StatusChangeDrawer } from "@/components/leads/StatusChangeDrawer"
import { LeadDetailTabs } from "@/components/leads/LeadDetailTabs"
import { ActivityFeed } from "@/components/leads/ActivityFeed"
import { AddNote } from "@/components/leads/AddNote"
import { Button } from "@/components/ui/button"
import { useLead } from "@/hooks/use-lead" // Corrected path
import { Skeleton } from "@/components/ui/skeleton"
import { updateLeadAction } from "@/app/actions/lead-actions" // Changed import
import { useToast } from "@/components/ui/use-toast" // Assuming useToast is in ui dir
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React from 'react'
import ReactConfetti from 'react-confetti'
import { useWindowSize } from 'react-use'; // For confetti dimensions
import { formatStatusLabel } from "@/lib/utils"; // Import formatStatusLabel
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadFiles } from "@/components/leads/lead-files";
import { LeadContractsTab } from "@/components/leads/tabs/LeadContractsTab";
import { LeadPhotosTab } from "@/components/leads/tabs/LeadPhotosTab"; // Import the new Photos tab component
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LeadOverviewTab } from "@/components/leads/tabs/LeadOverviewTab"
import { ImportantDates } from "@/components/leads/ImportantDates"
import { LeadEmailer } from "@/components/leads/LeadEmailer"
import { JobCompletionCard } from "@/components/leads/JobCompletionCard"
import { format, parseISO } from "date-fns"
import UploadToDriveSection from '@/components/leads/UploadToDriveSection'

// Quick Actions Button component
interface QuickActionButtonProps {
  onClick?: () => void;
  href?: string;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'contract' | 'sign' | 'filemanager' | 'photos' | 'addnote' | 'email';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ onClick, href, label, disabled, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'contract':
        return "bg-[#635380] border-l border-[#635380] hover:bg-white/10";
      case 'sign':
        return "bg-[#E8871E] border-l border-[#E8871E] hover:bg-white/10";
      case 'filemanager':
        return "bg-[#276FBF] border-l border-[#276FBF] hover:bg-white/10";
      case 'photos':
        return "bg-[#D64933] border-l border-[#D64933] hover:bg-white/10";
      case 'addnote':
        return "bg-[#14110F] border-l border-[#14110F] hover:bg-white/10";
      case 'email':
        return "bg-[#1D4ED8] border-l border-[#1D4ED8] hover:bg-white/10";
      default:
        return "bg-gradient-to-b from-black/40 via-black/30 via-black/20 to-white border-1 hover:from-slate-800/30 hover:via-slate-800/20 hover:to-white";
    }
  };

  const getIcon = () => {
    if (label.includes('Send Contract') || label.includes('Sending')) {
      return <FileSignature className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Sign in Person') || label.includes('Creating')) {
      return <PenTool className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Add Note')) {
      return <NotebookPen className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Photos')) {
      return <Image className="h-4 w-4 mr-1" />;
    }
    if (label.includes('File Manager')) {
      return <FileText className="h-4 w-4 mr-1" />;
    }
    if (label.includes('Send Email')) {
      return <Mail className="h-4 w-4 mr-1" />;
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

// Date Card Component for Lead Created and Job Completion
interface DateCardProps {
  title: string;
  date: Date | string | null;
  icon: React.ReactNode;
  className?: string;
  color?: string; // optional accent color for title & icon
  onClick?: () => void;
}

const DateCard: React.FC<DateCardProps> = ({ title, date, icon, className, color, onClick }) => {
  const formatDate = (dateValue: Date | string | null) => {
    if (!dateValue) return 'N/A'
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue
    return format(date, 'MMM d, yyyy')
  }

  const accentColor = color || '#FFFFFF';
  const formattedDate = formatDate(date);
  const dateObj = typeof date === 'string' ? parseISO(date as string) : date;
  const isPastDate = dateObj && dateObj < new Date();
  
  // Determine border color based on date status
  let borderClass = "border-gray-700";
  if (formattedDate) {
    borderClass = isPastDate ? "border-gray-500 border-2" : "border-lime-500 border-2";
  }

  return (
    <div className={cn(
      "h-16 p-2 flex flex-col items-center justify-center gap-0.5 rounded-lg border bg-black/60 transition-all duration-200",
      borderClass,
      className
    )}>
      <div className="flex-shrink-0" style={{ color: accentColor }}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-center leading-tight" style={{ color: accentColor }}>
        {title}
      </span>
      {formattedDate && (
        <span className="text-xs text-white text-center leading-tight font-semibold">
          {formattedDate}
        </span>
      )}
      {!formattedDate && (
        <span className="text-xs text-gray-400 text-center leading-tight mt-0.5">
          Not set
        </span>
      )}
    </div>
  );
};



// Status Progression Component
interface StatusProgressionProps {
  currentStatus: LeadStatus;
  leadId: string;
  onStatusChange: (status: LeadStatus) => void;
  isLoading: boolean;
  loadingStatus: LeadStatus | null;
}

const StatusProgression: React.FC<StatusProgressionProps> = ({
  currentStatus,
  leadId,
  onStatusChange,
  isLoading,
  loadingStatus
}) => {
  // Define the status progression order as specified
  const statusOrder: { status: LeadStatus; label: string; abbrev: string }[] = [
    { status: LeadStatus.follow_ups, label: "Follow Up", abbrev: "F-UP" },
    { status: LeadStatus.signed_contract, label: "Signed Contract", abbrev: "SIGN" },
    { status: LeadStatus.scheduled, label: "Scheduled", abbrev: "SCHED" },
    { status: LeadStatus.colors, label: "Colors", abbrev: "COLOR" },
    { status: LeadStatus.acv, label: "ACV", abbrev: "ACV" },
    { status: LeadStatus.job, label: "Job", abbrev: "JOB" },
    { status: LeadStatus.completed_jobs, label: "Completed Job", abbrev: "DONE" },
    { status: LeadStatus.zero_balance, label: "Zero Balance", abbrev: "PAID" },
    { status: LeadStatus.denied, label: "Denied", abbrev: "DEN" }
  ];

  const currentIndex = statusOrder.findIndex(item => item.status === currentStatus);

  // Map status to color and icon
  const statusMeta: Record<LeadStatus, { color: string; icon: React.ReactNode }> = {
    [LeadStatus.follow_ups]: { color: '#6B7280', icon: <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.signed_contract]: { color: '#635380', icon: <FileSignature className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.scheduled]: { color: '#E8871E', icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.colors]: { color: '#059669', icon: <Palette className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.acv]: { color: '#2563EB', icon: <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.job]: { color: '#F59E0B', icon: <Hammer className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.completed_jobs]: { color: '#10B981', icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.zero_balance]: { color: '#22C55E', icon: <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" /> },
    [LeadStatus.denied]: { color: '#EF4444', icon: <XIcon className="h-3 w-3 sm:h-4 sm:w-4" /> },
  }

  // Ref for auto-centering
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const currentBtn = buttonRefs.current[currentIndex]
    if (currentBtn && containerRef.current) {
      currentBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [currentIndex])

  const getStatusStyle = (status: LeadStatus, index: number) => {
    const meta = statusMeta[status]
    const isCurrent = status === currentStatus
    const distance = Math.abs(index - currentIndex)

    const base = "relative flex items-center justify-center text-white rounded-full transition-all duration-300 cursor-pointer select-none bg-gradient-to-b from-[#0f0f0f] via-[#1a1a1a] to-[#000] border border-lime-400/40 shadow-[inset_0_0_8px_rgba(0,255,160,0.25),0_0_6px_rgba(0,255,160,0.15)] hover:shadow-[inset_0_0_14px_rgba(0,255,160,0.5),0_0_12px_rgba(0,255,160,0.4)] hover:ring-2 hover:ring-lime-400/70 before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(transparent,rgba(0,255,160,0.25))] before:opacity-0 hover:before:opacity-100"
    const size = distance === 0 ? "w-12 h-12 sm:w-14 sm:h-14 text-[10px]" : distance === 1 ? "w-10 h-10 sm:w-12 sm:h-12 text-[9px]" : distance === 2 ? "w-8 h-8 sm:w-10 sm:h-10 text-[8px]" : "w-7 h-7 sm:w-8 sm:h-8 text-[6px]"
    const opacity = distance === 0 ? "opacity-100" : distance === 1 ? "opacity-90" : distance === 2 ? "opacity-60" : "opacity-30"
    const scale = distance === 0 ? "scale-110" : distance === 1 ? "scale-95" : distance === 2 ? "scale-85" : "scale-70"

    return `${base} ${size} ${opacity} ${scale}`
  }

  return (
    <div className="w-full px-2 sm:px-4">
      <div 
        ref={containerRef}
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-4 scrollbar-hide scroll-smooth scroll-px-6"
      >
        {statusOrder.map((item, index) => {
          const meta = statusMeta[item.status]
          const isCurrent = item.status === currentStatus
          const distance = Math.abs(index - currentIndex)
          const isPast = index < currentIndex

          return (
            <div key={item.status} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] sm:text-[10px] leading-none whitespace-nowrap">{item.abbrev}</span>
                <button
                  ref={el => {
                    buttonRefs.current[index] = el;
                  }}
                  onClick={() => onStatusChange(item.status)}
                  style={{ backgroundColor: meta.color, borderColor: meta.color }}
                  className={`${getStatusStyle(item.status, index)} border-2`}
                >
                  {meta.icon}
                  {isCurrent && (
                     <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute -bottom-1"/>
                   )}
                </button>
              </div>
              {/* connector */}
              {index < statusOrder.length - 1 && (
                <div
                  className="h-0.5 w-4 sm:w-6 rounded-full"
                  style={{ backgroundColor: isPast ? '#00ff7f' : '#4B5563', boxShadow: isPast ? '0 0 6px rgba(0,255,128,0.6)' : undefined }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// SectionNavButton component
const SectionNavButton: React.FC<{ label: string; color: string; onClick: () => void }> = ({ label, color, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'text-[11px] sm:text-xs font-semibold py-2 px-2 rounded-md bg-black/0 hover:bg-white/10',
      color,
      'w-full transition-colors duration-200 whitespace-nowrap'
    )}
  >
    {label}
  </button>
);

// Mobile top navigation bar (visible on screens < sm)
const MobileNavBar: React.FC<{ onNavigate: (id: string) => void }> = ({ onNavigate }) => {
  const buttons = [
    { label: 'Schedule', id: 'schedule-info', color: 'text-white' },
    { label: 'Contracts', id: 'contracts-info', color: 'text-white' },
    { label: 'Upload', id: 'upload-info', color: 'text-white' },
    { label: 'Summary', id: 'summary-info', color: 'text-white' },
    { label: 'Contact', id: 'contact-info', color: 'text-white' },
    { label: 'Insurance', id: 'insurance-info', color: 'text-white' },
    { label: 'Adjuster', id: 'adjuster-info', color: 'text-white' },
    { label: 'Activity', id: 'activity-info', color: 'text-white' },
  ] as const;

  return (
    <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-white/20">
      <div className="flex overflow-x-auto no-scrollbar px-2 py-1 gap-2 items-center">
        {buttons.map((b, idx) => (
          <React.Fragment key={b.id}>
            <SectionNavButton label={b.label} color={b.color} onClick={() => onNavigate(b.id)} />
            {idx !== buttons.length - 1 && <span className="h-4 w-px bg-white/20" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default function LeadDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams(); // Get search params
  const id = typeof params?.id === 'string' ? params.id : undefined;
  
  const { lead, isLoading: isLeadLoading, error, mutate } = useLead(id) // useLead hook handles undefined id
  
  // Determine initial tab: from URL query or default to "overview"
  const initialTab = searchParams?.get("tab") === "files" ? "files" : "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  const { toast } = useToast()

  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [statusBeingUpdated, setStatusBeingUpdated] = useState<LeadStatus | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { width, height } = useWindowSize(); // For confetti

  // Street View related state
  const [streetViewUrl, setStreetViewUrl] = useState<string>("")
  const [isStreetViewLoading, setIsStreetViewLoading] = useState(true)
  const [streetViewError, setStreetViewError] = useState<string | null>(null)

  // Contract and dialog state
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [isSendingContract, setIsSendingContract] = useState(false);
  const [contractSuccessData, setContractSuccessData] = useState<any>(null);
  const [isSigningInPerson, setIsSigningInPerson] = useState(false);
  const [showContractSaveDialog, setShowContractSaveDialog] = useState(false);
  const [completedContracts, setCompletedContracts] = useState<any[]>([]);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [dialogDismissed, setDialogDismissed] = useState(false);

  // Add a reference to the activity feed for refreshing
  const activityFeedRef = useRef<HTMLDivElement>(null);
  const addNoteRef = useRef<HTMLDivElement>(null);
  // Refs for section navigation
  const scheduleRef = useRef<HTMLDivElement>(null);
  const contractsSectionRef = useRef<HTMLDivElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const activityRef = activityFeedRef; // reuse existing ref

  const [refreshActivities, setRefreshActivities] = useState(0);
  
  // Function to refresh activities when new note is added
  const handleNoteAdded = () => {
    // Increment refresh counter to trigger useEffect in ActivityFeed
    setRefreshActivities(prev => prev + 1);
  };

  // Street View URL generation
  useEffect(() => {
    if (lead?.address) {
      setIsStreetViewLoading(true)
      setStreetViewError(null)
      
      const url = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(lead.address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      setStreetViewUrl(url)
    }
  }, [lead?.address])

  // Check for completed contracts
  const checkCompletedContracts = async () => {
    if (!lead?.id) return;

    try {
      const response = await fetch(`/api/leads/${lead.id}/contracts/completed`);
      if (response.ok) {
        const data = await response.json();
        const completed = data.contracts?.filter((contract: any) => 
          contract.status === 'completed' || contract.status === 'signed'
        ) || [];
        
        setCompletedContracts(completed);
        
        // Show save dialog if there are completed contracts and dialog hasn't been dismissed
        if (completed.length > 0 && !dialogDismissed) {
          // Add a small delay to ensure UI is ready
          setTimeout(() => {
            setShowContractSaveDialog(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error checking completed contracts:', error);
    }
  };

  // Check for completed contracts when component mounts or lead changes
  useEffect(() => {
    if (lead?.id && !dialogDismissed) {
      // Add a delay to avoid showing immediately
      const timer = setTimeout(() => {
        checkCompletedContracts();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [lead?.id, dialogDismissed]);

  // Effect to update activeTab if query parameter changes after initial load (optional, but good practice)
  useEffect(() => {
    const tabFromQuery = searchParams?.get("tab");
    if (tabFromQuery === "files" && activeTab !== "files") {
      setActiveTab("files");
    } else if (!tabFromQuery && activeTab !== "overview" && !searchParams?.has("tab")) {
      // If no tab query param and current tab is not overview, reset to overview (or keep current based on preference)
      // For now, let's be explicit: if 'files' is in query, switch to it. Otherwise, initialTab handles default.
    }
  }, [searchParams, activeTab]);

  // Helper function to get important date from metadata
  const getImportantDateFromMetadata = (dateKey: string): string | null => {
    const metadata = lead?.metadata as Record<string, any> | null;
    return metadata?.importantDates?.[dateKey] || null;
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!id) {
      toast({ title: "Error", description: "Lead ID is missing.", variant: "destructive" });
      return;
    }
    if (isStatusUpdating) return; // Prevent multiple updates

    setIsStatusUpdating(true);
    setStatusBeingUpdated(newStatus);
    setShowSuccessMessage(false); // Hide previous success message if any

    try {
      const result = await updateLeadAction(id, { status: newStatus }) 
      
      if (result.success) {
        // Automatically set jobCompletionDate if status is completed_jobs and date is not set
        if (newStatus === LeadStatus.completed_jobs && !getImportantDateFromMetadata('jobCompletionDate')) {
          try {
            await fetch(`/api/leads/${id}/important-dates`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dateType: 'jobCompletionDate',
                date: new Date().toISOString()
              })
            })
            mutate()
          } catch (err) {
            console.error('Failed to set job completion date:', err)
          }
        }
        setShowSuccessMessage(true);
        mutate();
        // Optional: auto-hide success message
        setTimeout(() => setShowSuccessMessage(false), 5000); 
      } else {
        toast({
          title: "Error Updating Status",
          description: result.error || "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Client-Side Error",
        description: "Failed to update lead status due to a network or client error.",
        variant: "destructive",
      })
      console.error("Failed to update lead status:", err);
    } finally {
      setIsStatusUpdating(false);
      setStatusBeingUpdated(null);
    }
  }

  const handleScheduleAppointment = () => {
    if (!lead || !id) return;
    
    // Create a URL-safe version of the lead name
    const leadName = lead.firstName && lead.lastName 
      ? `${lead.firstName} ${lead.lastName}` 
      : lead.email || 'Unknown Lead';
    
    // Route to calendar with lead info
    window.location.href = `/dashboard/calendar?leadId=${id}&leadName=${encodeURIComponent(leadName)}&returnUrl=${encodeURIComponent(`/leads/${id}`)}`;
  };

  const handleSendContract = async () => {
    if (!lead) return;
    
    setIsSendingContract(true);
    setShowLoadingDialog(true);
    
    try {
      const response = await fetch('/api/docuseal/send-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId: lead.id,
          templateId: 2 // Default to Scope of Work template
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setContractSuccessData(data);
        setShowSuccessMessage(true);
        mutate();
        setShowLoadingDialog(false);
      } else {
        throw new Error('Failed to send contract');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send contract. Please try again.",
        variant: "destructive",
      });
      setShowLoadingDialog(false);
    } finally {
      setIsSendingContract(false);
    }
  };

  const handleSignInPerson = async () => {
    if (!lead) return;
    
    setIsSigningInPerson(true);
    
    try {
      const response = await fetch('/api/sign-in-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Contract created for in-person signing.",
        });
      } else {
        throw new Error('Failed to create contract');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningInPerson(false);
    }
  };

  const handleScrollToAddNote = () => {
    if (addNoteRef.current) {
      addNoteRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveContractsToDrive = async () => {
    if (!lead?.id || completedContracts.length === 0) return;

    setIsSavingToDrive(true);

    try {
      const response = await fetch(`/api/leads/${lead.id}/contracts/save-to-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contracts: completedContracts })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Success!",
          description: `${completedContracts.length} contract(s) saved to Google Drive`,
        });
        setShowContractSaveDialog(false);
        setDialogDismissed(true); // Prevent dialog from showing again
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || 'Failed to save contracts to Google Drive.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving contracts:', error);
      toast({
        title: "Error",
        description: 'Failed to save contracts. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Construct address string safely
  const addressString = lead 
    ? lead.address || "Address not available" // Use the single address field, provide fallback for null
    : "Loading address...";

  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [contractsDialogOpen, setContractsDialogOpen] = useState(false);
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const handleOpenFilesDialog = () => setFilesDialogOpen(true);
  const handleCloseFilesDialog = () => setFilesDialogOpen(false);
  const handleOpenContractsDialog = () => setContractsDialogOpen(true);
  const handleCloseContractsDialog = () => setContractsDialogOpen(false);
  const handleOpenPhotosDialog = () => setPhotosDialogOpen(true);
  const handleClosePhotosDialog = () => setPhotosDialogOpen(false);
  const handleOpenEmailDialog = () => setEmailDialogOpen(true);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  };

  if (isLeadLoading && !lead) { // Show skeleton only on initial load
    return <LeadDetailSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-lg mx-auto border-destructive/50">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" /> Error Loading Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-2">
              {error?.message || "The requested lead could not be found or an error occurred."}
            </p>
            <p className="text-sm text-muted-foreground">Lead ID: {id || "Unknown"}</p>
            <Button onClick={() => mutate()} className="mt-4">Try Reloading</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!lead) { // Handle case where lead is null after loading (e.g. not found, but no error from hook)
     return (
      <div className="container mx-auto py-10 text-center">
         <p className="text-xl text-muted-foreground">Lead not found.</p>
         <p className="text-sm text-muted-foreground">Lead ID: {id || "Unknown"}</p>
      </div>
    )
  }

  const leadEmail = lead.email;
  const leadPhone = lead.phone;
  const leadAddress = lead.address;

  return (
    <>
      {/* Mobile Navigation Bar */}
      <MobileNavBar onNavigate={scrollToId} />

      <div className="container mx-auto px-4 pt-20 sm:pt-4 pb-4 sm:px-6 sm:py-8 space-y-4 md:space-y-6 relative">
        {showSuccessMessage && (
          <>
            <div className="fixed inset-0 z-[60]">
              <ReactConfetti width={width} height={height} numberOfPieces={200} recycle={false} />
            </div>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowSuccessMessage(false)}></div>
            <Card className="fixed top-[500px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-11/12 max-w-md p-6 shadow-2xl bg-card animate-in fade-in duration-300 scale-in-center">
              <CardHeader className="p-0 mb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-2xl text-green-600 dark:text-green-500">
                    <CheckCircle2 className="h-8 w-8" /> {contractSuccessData ? "Contract Sent!" : "Congratulations!"}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowSuccessMessage(false)} className="text-muted-foreground hover:text-foreground">
                    <XIcon className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 text-center">
                {contractSuccessData ? (
                  <>
                    <p className="text-lg mb-1">📄 Contract successfully sent to</p>
                    <p className="text-xl font-semibold text-blue-600 mb-2">{contractSuccessData.email}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Submission ID: {contractSuccessData.id} • Status: {contractSuccessData.status}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-1">Lead status successfully updated to</p>
                    <p className="text-xl font-semibold text-green-500 mb-4">{lead.status ? formatStatusLabel(lead.status) : "the new status"}!</p>
                  </>
                )}
                <Button onClick={() => setShowSuccessMessage(false)} className="w-full text-black sm:w-auto">Close</Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Status Progression - Top of page */}
        <div className="w-full mb-6">
          <StatusProgression
            currentStatus={lead.status}
            leadId={lead.id}
            onStatusChange={handleStatusChange}
            isLoading={isStatusUpdating}
            loadingStatus={statusBeingUpdated}
          />
        </div>

        {/* Name and Claim Number Row */}
        <div className="w-full flex justify-between items-center mb-4">
          {/* Lead Name - Left */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
            {lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.email || lead.phone || "Lead Details"}
          </h1>
          
          {/* Claim Number - Right, above streetview */}
          {lead.claimNumber && (
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-[8px] sm:text-[10px]">Claim #</span>
              <span className="text-green-500 text-lg sm:text-xl font-medium">{lead.claimNumber}</span>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-4 sm:gap-6">
          {/* Street View Section */}
          {lead?.address && (
            <div className="w-full">
              <Card className="w-full overflow-hidden">
                <CardContent className="p-0">
                  {streetViewUrl && (
                    <div className="relative w-full h-[400px]">
                      {/* Address Overlay */}
                      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-slate-900/70 p-2 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-300" />
                          <span className="truncate text-sm font-medium text-gray-100">{lead.address}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(lead.address || '')}`, '_blank', 'noopener,noreferrer')}
                          className="flex-shrink-0 text-blue-400 hover:text-blue-300"
                        >
                          Open in Maps
                        </Button>
                      </div>
                      
                      {/* Date Cards Overlay */}
                      <div className="absolute top-14 left-2 z-10 flex gap-2">
                        <DateCard
                          title="Created"
                          date={lead.createdAt}
                          icon={<CalendarDays className="h-[25px] w-4" />}
                          color="#51D6FF"
                          className="w-28"
                        />
                        <div className="w-28">
                          <JobCompletionCard lead={lead} />
                        </div>
                      </div>
                      
                      <img
                        src={streetViewUrl}
                        alt={`Street view of ${lead.address}`}
                        className="w-full h-full object-cover"
                        onLoad={() => setIsStreetViewLoading(false)}
                        onError={() => {
                          setIsStreetViewLoading(false)
                          setStreetViewError("Failed to load Street View image")
                        }}
                      />
                      {isStreetViewLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <Skeleton className="w-full h-full" />
                        </div>
                      )}
                      {streetViewError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                          <p>{streetViewError}</p>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 flex w-full text-center border-t-2 border-white rounded-t-xl shadow-inner shadow-black/40 bg-black/60 backdrop-blur">
                        <QuickActionButton 
                          href={`/leads/${id}/files`}
                          label="File Manager" 
                          variant="filemanager"
                        />
                        <QuickActionButton 
                          onClick={handleOpenPhotosDialog} 
                          label="Photos" 
                          variant="photos"
                        />
                        <QuickActionButton
                          onClick={handleScrollToAddNote}
                          label="Add Note"
                          variant="addnote"
                        />
                        <QuickActionButton
                          onClick={handleSendContract}
                          label={isSendingContract ? "Sending..." : "Send Contract"}
                          disabled={!lead || isSendingContract}
                          variant="contract"
                        />
                        <QuickActionButton
                          onClick={handleSignInPerson}
                          label={isSigningInPerson ? "Creating..." : "Sign in Person"}
                          disabled={!lead || isSigningInPerson}
                          variant="sign"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Important Dates & Scheduler */}
              <div className="w-full mt-6" ref={scheduleRef} id="schedule-info">
                <ImportantDates lead={lead} />
              </div>

              {/* Upload to Drive Section */}
              <div className="w-full mt-6" ref={uploadSectionRef} id="upload-info">
                 <UploadToDriveSection leadId={lead.id} />
              </div>

              {/* Contracts Section */}
              <div className="w-full mt-6" id="contracts-info">
                <div className="rounded-xl p-4 bg-gradient-to-b from-[#0f0f0f] via-[#1a1a1a] to-black border border-lime-400/20 shadow-inner shadow-lime-400/10">
                  <LeadContractsTab leadId={lead.id} />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-lime-500/50 to-transparent my-2 sm:my-3" />
              
        {/* Divider under quick action tabs */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent" />
        
        {/* Main content area - Two column layout on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6">
          {/* Left column - Lead Detail Tabs and Add Note */}
          <div className="flex flex-col gap-6">
            <div className="space-y-4" ref={summaryRef} id="summary-info">
              <LeadDetailTabs 
                lead={lead}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              {/* Divider under lead overview tab */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent" />
            </div>
            <div className="w-full" ref={addNoteRef}>
              <AddNote leadId={lead.id} onSuccess={handleNoteAdded} />
            </div>
          </div>

          {/* Right column - Activity Feed only */}
          <div className="w-full" ref={activityRef} id="activity-info">
            <ActivityFeed leadId={lead.id} key={refreshActivities} />
          </div>
        </div>

        {/* Files Dialog */}
        <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Files</DialogTitle>
            </DialogHeader>
            <LeadFiles leadId={lead.id} />
          </DialogContent>
        </Dialog>

        {/* Photos Dialog */}
        <Dialog open={photosDialogOpen} onOpenChange={setPhotosDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Photos</DialogTitle>
            </DialogHeader>
            <LeadPhotosTab 
              leadId={lead.id}
              claimNumber={lead.claimNumber || undefined}
            />
          </DialogContent>
        </Dialog>

        {/* Contracts Dialog */}
        <Dialog open={contractsDialogOpen} onOpenChange={setContractsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contracts</DialogTitle>
            </DialogHeader>
            <LeadContractsTab leadId={lead.id} />
          </DialogContent>
        </Dialog>

        {/* Emailer Dialog */}
        {lead && (
          <LeadEmailer lead={lead} open={emailDialogOpen} onOpenChange={setEmailDialogOpen} />
        )}

        <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
          <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-6 gap-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-lg font-medium">Processing...</span>
            </div>
            <p className="text-center text-muted-foreground">
              Your contract is being sent. This may take a few moments.
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

function LeadDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8 space-y-4 md:space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-3 sm:gap-4 mb-2 sm:mb-0">
        <Skeleton className="h-8 w-48 sm:w-72" />
      </div>
      
      <Card className="p-3 sm:p-4">
        <Skeleton className="h-4 sm:h-5 w-20 sm:w-24 mb-2 sm:mb-3" />
        <div className="flex flex-wrap gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-[calc(25%-0.5rem)] sm:h-16 sm:w-[calc(14.28%-0.5rem)] min-w-[3.5rem] rounded-md" />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 sm:h-24 rounded-lg" />
        ))}
      </div>

      <div className="mb-3 sm:mb-4">
        <Skeleton className="h-10 w-full rounded-lg md:hidden" />
        <Skeleton className="h-10 w-full rounded-lg hidden md:block" />
      </div>
      <Card>
        <CardContent className="p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
          <Skeleton className="h-full w-full rounded-md" />
        </CardContent>
      </Card>

      <Card className="mt-4 md:mt-6">
        <CardHeader><Skeleton className="h-5 sm:h-6 w-28 sm:w-32" /></CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_,i) => { return <Skeleton key={i} className="h-10 sm:h-12 w-full" />; })}
        </CardContent>
      </Card>
    </div>
  )
}