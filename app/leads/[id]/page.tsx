"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation" // Use next/navigation for App Router
import { LeadStatus } from "@prisma/client"
import { Phone, Mail, CalendarPlus, MapPin, AlertTriangle, CheckCircle2, XIcon, FileText, FileArchive, Image, FileSignature, Copy, Loader2, NotebookPen } from "lucide-react" // Added NotebookPen icon
import { StatusChangeDrawer } from "@/components/leads/StatusChangeDrawer"
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
import { LeadPhotosTab } from "@/components/leads/tabs/LeadPhotosTab"; // Import the new Photos tab component
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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
    className: cn(
      "relative flex h-24 flex-1 flex-col items-center justify-center bg-gradient-to-b from-black/40 via-black/30 via-black/20 to-lime-500/30 backdrop-blur-lg p-2 text-md font-bold text-white",
      "border-l border-lime-500 first:border-l-0",
      "transition-colors hover:from-slate-800/30 hover:via-slate-800/20 hover:to-lime-500/30",
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
      {icon}
      <span>{label}</span>
    </Tag>
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

  // Add a reference to the activity feed for refreshing
  const activityFeedRef = useRef<HTMLDivElement>(null);
  const addNoteRef = useRef<HTMLDivElement>(null);
  const [refreshActivities, setRefreshActivities] = useState(0);
  
  // Function to refresh activities when new note is added
  const handleNoteAdded = () => {
    // Increment refresh counter to trigger useEffect in ActivityFeed
    setRefreshActivities(prev => prev + 1);
  };

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
  const [photosDialogOpen, setPhotosDialogOpen] = useState(false);

  const handleOpenFilesDialog = () => setFilesDialogOpen(true);
  const handleCloseFilesDialog = () => setFilesDialogOpen(false);
  const handleOpenContractsDialog = () => setContractsDialogOpen(true);
  const handleCloseContractsDialog = () => setContractsDialogOpen(false);
  const handleOpenPhotosDialog = () => setPhotosDialogOpen(true);
  const handleClosePhotosDialog = () => setPhotosDialogOpen(false);

  const [streetViewUrl, setStreetViewUrl] = useState<string>("")
  const [isStreetViewLoading, setIsStreetViewLoading] = useState(true)
  const [streetViewError, setStreetViewError] = useState<string | null>(null)
  const [isCloningContract, setIsCloningContract] = useState(false);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [isSendingContract, setIsSendingContract] = useState(false);
  const [sendContractDialog, setSendContractDialog] = useState(false);
  const [contractSuccessData, setContractSuccessData] = useState<any>(null);

  useEffect(() => {
    if (lead?.address) {
      setIsStreetViewLoading(true)
      setStreetViewError(null)
      const encodedAddress = encodeURIComponent(lead.address)
      const url = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${encodedAddress}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      setStreetViewUrl(url)
    }
  }, [lead?.address])

  const handleCopyMessage = () => {
    if (!lead) return;

    const message = `Hello ${lead.firstName ?? 'Valued Customer'},

The general agreement for the property at ${lead.address ?? 'your property'} is ready.
Please review the document and, when everything looks correct, click the "Sign" button at the top of the page to add your electronic signature.

You'll receive a confirmation email as soon as the signature is recorded, and then, we'll be able to move forward with scheduling.

If you have any questions about the agreement, just reply to this message for the quickest response.

Thank you for choosing In-Vision Construction!`;

    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "Message Copied!",
        description: "The e-sign message has been copied to your clipboard.",
      });
    }).catch(err => {
      toast({
        title: "Error",
        description: "Could not copy message to clipboard.",
        variant: "destructive",
      });
      console.error('Failed to copy message: ', err);
    });
  };

  const handleSendForSignature = async () => {
    if (!id) return;

    setIsCloningContract(true);
    setShowLoadingDialog(true);
    try {
      const response = await fetch('/api/contracts/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create contract.');
      }

      console.log("Contract clone API response:", result);

      if (!result.url) {
        console.error("API response is missing the 'url' property.");
        throw new Error("Failed to get contract URL from the server.");
      }

      window.open(result.url, '_blank');
      toast({
        title: "Contract Ready",
        description: 'Click "File ▸ Request eSignature" in Google Docs.',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCloningContract(false);
      setShowLoadingDialog(false);
    }
  };

  const handleSendContract = async () => {
    if (!lead) return;
    
    setIsSendingContract(true);
    setSendContractDialog(true);
    
    try {
      const response = await fetch('/api/send-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lead }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send contract');
      }

      const result = await response.json();
      
      // Close loading dialog immediately
      setSendContractDialog(false);
      
      // Trigger confetti celebration
      setContractSuccessData(result[0]);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setContractSuccessData(null);
      }, 5000);
      
      // Show success toast with details
      toast({
        title: "🎉 Contract Sent Successfully!",
        description: `DocuSeal contract sent to ${lead.email}. Submission ID: ${result[0]?.id || 'Generated'}. They will receive an email with signing instructions and can access the contract at the provided link.`,
      });
      
      console.log('Contract sent result:', result);
    } catch (error) {
      console.error('Error sending contract:', error);
      
      // Close loading dialog
      setSendContractDialog(false);
      
      // Show detailed error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred while sending the contract.";
      
      toast({
        title: "❌ Contract Send Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSendingContract(false);
    }
  };

  const handleScrollToAddNote = () => {
    if (addNoteRef.current) {
      addNoteRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Optional: focus on the textarea after scrolling
      setTimeout(() => {
        const textarea = addNoteRef.current?.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }, 500);
    }
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

      <div className="w-full flex flex-col gap-4 sm:gap-6">
        {/* Top section with name, status, and claim number */}
        <div className="w-full grid grid-cols-3 items-start">
          {/* Name on the left */}
          <div className="text-left">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">
              {lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.email || lead.phone || "Lead Details"}
            </h1>
          </div>

          {/* Status in the middle */}
          <div className="flex flex-col items-center justify-center">
            <Badge variant={lead.status as any} className="text-sm px-2 py-1">
              {formatStatusLabel(lead.status)}
            </Badge>
            <div className="mt-2">
              <StatusChangeDrawer
                currentStatus={lead.status}
                onStatusChange={handleStatusChange}
                isLoading={isStatusUpdating}
                loadingStatus={statusBeingUpdated}
              />
            </div>
          </div>

          {/* Claim number on the right */}
          {lead.claimNumber && (
            <div className="flex flex-col items-end">
              <span className="text-gray-500 text-[8px] sm:text-[10px] leading-none">Claim #</span>
              <span className="text-green-500 text-xs sm:text-sm font-medium leading-none">{lead.claimNumber}</span>
            </div>
          )}
        </div>

        {/* Street View Section */}
        {lead?.address && (
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
                  <div className="absolute bottom-0 left-0 right-0 flex w-full border-t border-b-[2px] border-lime-500">
                    <QuickActionButton 
                      onClick={handleOpenFilesDialog} 
                      icon={<FileArchive className="h-5 w-5" />} 
                      label="Files" 
                    />
                    <QuickActionButton 
                      onClick={handleOpenPhotosDialog} 
                      icon={<Image className="h-5 w-5" />} 
                      label="Photos" 
                    />
                    <QuickActionButton
                      onClick={handleScrollToAddNote}
                      icon={<NotebookPen className="h-5 w-5" />}
                      label="Add Note"
                    />
                    <QuickActionButton
                      onClick={handleSendContract}
                      icon={<FileSignature className="mb-2 h-6 w-6" />}
                      label={isSendingContract ? "Sending..." : "Send Contract"}
                      disabled={!lead || isSendingContract}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
          <div className="space-y-4">
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
        <div className="w-full" ref={activityFeedRef}>
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

      <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
        <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-4 border-lime-500/30 animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-[6px] rounded-full border-4 border-lime-500/40 animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-[12px] rounded-full border-4 border-lime-500/60 animate-[spin_1.5s_linear_infinite]"></div>
          </div>
          <h2 className="text-xl font-semibold text-center mt-4">Preparing E-Sign Document</h2>
          <p className="text-center text-muted-foreground">
            Creating a new contract for electronic signature...
          </p>
        </DialogContent>
      </Dialog>

      {/* Send Contract Loading Dialog */}
      <Dialog open={sendContractDialog} onOpenChange={setSendContractDialog}>
        <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-20 h-20 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-[4px] rounded-full border-4 border-blue-500/40 animate-[spin_2s_linear_infinite_reverse]"></div>
            <div className="absolute inset-[8px] rounded-full border-4 border-blue-500/60 animate-[spin_1.5s_linear_infinite]"></div>
            <div className="absolute inset-[12px] rounded-full border-4 border-blue-500/80 animate-[spin_1s_linear_infinite_reverse]"></div>
            <div className="absolute inset-[16px] rounded-full bg-blue-500/10 animate-pulse"></div>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-blue-600">📄 Sending Contract</h2>
            <div className="space-y-2">
              <p className="text-lg font-semibold">Preparing DocuSeal contract...</p>
              <p className="text-sm text-muted-foreground">
                Creating personalized contract for <span className="font-medium text-blue-600">{lead?.email}</span>
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
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
