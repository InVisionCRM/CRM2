"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation" // Use next/navigation for App Router
import { LeadStatus } from "@prisma/client"
import { Phone, Mail, CalendarPlus, MapPin, AlertTriangle, CheckCircle2, XIcon, FileText, FileArchive } from "lucide-react" // Updated icons
import { LeadStatusBar } from "@/components/leads/LeadStatusBar" // Corrected path
import { LeadDetailTabs } from "@/components/leads/LeadDetailTabs" // Corrected path
import { ActivityFeed } from "@/components/leads/ActivityFeed" // Corrected path
import { AddNote } from "@/components/leads/AddNote" // New import
import { Button } from "@/components/ui/button"
import { useLead } from "@/hooks/use-lead" // Corrected path
import { Skeleton } from "@/components/ui/skeleton"
import { updateLeadAction } from "@/app/actions/lead-actions" // Changed import
import { useToast } from "@/components/ui/use-toast" // Assuming useToast is in ui dir
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use'; // For confetti dimensions
import { formatStatusLabel } from "@/lib/utils"; // Import formatStatusLabel
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadFiles } from "@/components/leads/lead-files";
import { LeadContractsTab } from "@/components/leads/tabs/LeadContractsTab";

// Quick Actions Button component
interface QuickActionButtonProps {
  onClick?: () => void;
  href?: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ onClick, href, icon, label, disabled }) => {
  const commonProps = {
    className: "btn flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-lg hover:bg-muted/80 shadow-sm transition-all h-full text-sm",
    disabled: disabled,
  };

  if (href && !onClick) {
    return (
      <a href={disabled ? undefined : href} target="_blank" rel="noopener noreferrer" {...commonProps}>
        {icon}
        <span>{label}</span>
      </a>
    );
  }

  return (
    <Button variant="outline" onClick={onClick} {...commonProps} asChild={!onClick && !!href}>
      <div className="flex flex-col items-center justify-center gap-1.5 h-full">
        {icon}
        <span>{label}</span>
      </div>
    </Button>
  );
};

export default function LeadDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams(); // Get search params
  const id = typeof params.id === 'string' ? params.id : undefined;
  
  const { lead, isLoading: isLeadLoading, error, mutate } = useLead(id) // useLead hook handles undefined id
  
  // Determine initial tab: from URL query or default to "overview"
  const initialTab = searchParams.get("tab") === "files" ? "files" : "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  const { toast } = useToast()

  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [statusBeingUpdated, setStatusBeingUpdated] = useState<LeadStatus | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { width, height } = useWindowSize(); // For confetti

  // Add a reference to the activity feed for refreshing
  const activityFeedRef = useRef<HTMLDivElement>(null);
  const [refreshActivities, setRefreshActivities] = useState(0);
  
  // Function to refresh activities when new note is added
  const handleNoteAdded = () => {
    // Increment refresh counter to trigger useEffect in ActivityFeed
    setRefreshActivities(prev => prev + 1);
  };

  // Effect to update activeTab if query parameter changes after initial load (optional, but good practice)
  useEffect(() => {
    const tabFromQuery = searchParams.get("tab");
    if (tabFromQuery === "files" && activeTab !== "files") {
      setActiveTab("files");
    } else if (!tabFromQuery && activeTab !== "overview" && !searchParams.has("tab")) {
      // If no tab query param and current tab is not overview, reset to overview (or keep current based on preference)
      // For now, let's be explicit: if 'files' is in query, switch to it. Otherwise, initialTab handles default.
    }
  }, [searchParams, activeTab]);

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
        // toast({ // Can replace toast with the success card
        //   title: "Status Updated",
        //   description: `Lead status successfully changed to ${newStatus}.`,
        // })
        mutate() // Re-fetch data to confirm update and get latest state
        setShowSuccessMessage(true);
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

  // Construct address string safely
  const addressString = lead 
    ? lead.address || "Address not available" // Use the single address field, provide fallback for null
    : "Loading address...";

  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [contractsDialogOpen, setContractsDialogOpen] = useState(false);

  const handleOpenFilesDialog = () => setFilesDialogOpen(true);
  const handleCloseFilesDialog = () => setFilesDialogOpen(false);
  const handleOpenContractsDialog = () => setContractsDialogOpen(true);
  const handleCloseContractsDialog = () => setContractsDialogOpen(false);

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
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-8 space-y-4 md:space-y-6 relative">
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
                  <CheckCircle2 className="h-8 w-8" /> Congratulations!
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowSuccessMessage(false)} className="text-muted-foreground hover:text-foreground">
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 text-center">
              <p className="text-lg mb-1">Lead status successfully updated to</p>
              <p className="text-xl font-semibold text-green-500 mb-4">{lead.status ? formatStatusLabel(lead.status) : "the new status"}!</p>
              <Button onClick={() => setShowSuccessMessage(false)} className="w-full text-black sm:w-auto">Close</Button>
            </CardContent>
          </Card>
        </>
      )}

      <div className="w-full flex items-center justify-between mb-2 sm:mb-0">
        <h1 className="text-xl sm:text-2xl font-semibold truncate">
          {lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.email || lead.phone || "Lead Details"}
        </h1>
        {lead.claimNumber && (
          <div className="flex items-center text-lg sm:text-xl font-medium text-green-500">
            <span className="mr-1 text-gray-500 text-sm sm:text-base">Claim #:</span>
            {lead.claimNumber}
          </div>
        )}
      </div>
      
      <LeadStatusBar 
        currentStatus={lead.status}
        onStatusChange={handleStatusChange}
        isLoading={isStatusUpdating}
        loadingStatus={statusBeingUpdated}
      />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
        <QuickActionButton 
          href={leadPhone ? `tel:${leadPhone}` : undefined}
          icon={<Phone className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#59FF00' }} />}
          label="Call"
          disabled={!leadPhone}
        />
        <QuickActionButton 
          href={leadEmail ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(leadEmail)}` : undefined}
          icon={<Mail className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#59FF00' }} />}
          label="Email"
          disabled={!leadEmail}
        />
        <QuickActionButton 
          onClick={handleScheduleAppointment}
          icon={<CalendarPlus className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#59FF00' }} />}
          label="Schedule"
        />
        <QuickActionButton 
          href={leadAddress ? `https://maps.google.com/?q=${encodeURIComponent(leadAddress)}` : undefined}
          icon={<MapPin className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#59FF00' }} />}
          label="Map"
          disabled={!leadAddress}
        />
        <QuickActionButton 
          onClick={handleOpenFilesDialog}
          icon={<FileText className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#59FF00' }} />}
          label="Files"
        />
        <QuickActionButton 
          onClick={handleOpenContractsDialog}
          icon={<FileArchive className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#59FF00' }} />}
          label="Contracts"
        />
      </div>
      
      <LeadDetailTabs 
        lead={lead}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <AddNote leadId={lead.id} onSuccess={handleNoteAdded} />
        </div>
        
        <div className="col-span-2" ref={activityFeedRef}>
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

      {/* Contracts Dialog */}
      <Dialog open={contractsDialogOpen} onOpenChange={setContractsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contracts</DialogTitle>
          </DialogHeader>
          <LeadContractsTab leadId={lead.id} />
        </DialogContent>
      </Dialog>
    </div>
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
