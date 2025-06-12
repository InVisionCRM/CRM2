"use client"

import { formatDistanceToNow, format, isValid, parse } from "date-fns"
import { useState, useEffect, useRef } from "react"
import type { Lead } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Check, Loader2, Phone, Mail, MapPin, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink, FileText, Eye, Upload } from "lucide-react"
import { formatStatusLabel } from "@/lib/utils"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Avatar removed
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { updateLeadAssigneeAction } from "@/app/actions/lead-actions"
import { getAssignableUsersAction } from "@/app/actions/user-actions"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface ContractStatus {
  id: number;
  status: string;
  template: {
    name: string;
  };
  created_at: string;
  audit_log_url: string | null;
  submitters: Array<{
    email: string;
    status: string;
  }>;
}

interface UploadedContract {
  url: string;
  name: string;
  uploadedAt: string;
}

interface LeadOverviewTabProps {
  lead: (Lead & { assignedTo?: { name?: string | null } | null }) | null;
  onEditRequest?: (section: 'contact' | 'insurance' | 'adjuster') => void;
}

// Add this new component for interactive contact info
interface ContactItemProps {
  label: string;
  value: string | null;
  type: 'phone' | 'email' | 'address';
  className?: string;
}

const ContactItem = ({ label, value, type, className }: ContactItemProps) => {
  if (!value) return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs sm:text-sm">N/A</p>
    </div>
  );

  const handleClick = () => {
    switch (type) {
      case 'phone':
        window.location.href = `tel:${value}`;
        break;
      case 'email':
        window.location.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(value)}`;
        break;
      case 'address':
        window.location.href = `https://maps.google.com/?q=${encodeURIComponent(value)}`;
        break;
    }
  };

  const icon = {
    phone: <Phone className="h-3 w-3 text-lime-500" />,
    email: <Mail className="h-3 w-3 text-lime-500" />,
    address: <MapPin className="h-3 w-3 text-lime-500" />
  }[type];

  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-xs sm:text-sm">{value}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 rounded-full hover:bg-lime-500/10 text-lime-500 hover:text-lime-600"
          onClick={handleClick}
        >
          {icon}
          <span className="sr-only">Contact via {type}</span>
        </Button>
      </div>
    </div>
  );
};

// Utility functions for contract status
const getContractStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    case 'pending':
    case 'sent':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    case 'declined':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    case 'expired':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
    case 'opened':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
  }
}

const getContractStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-3 w-3" />
    case 'pending':
    case 'sent':
      return <Clock className="h-3 w-3" />
    case 'declined':
      return <XCircle className="h-3 w-3" />
    case 'expired':
      return <AlertTriangle className="h-3 w-3" />
    case 'opened':
      return <ExternalLink className="h-3 w-3" />
    default:
      return <FileText className="h-3 w-3" />
  }
}

export const LeadOverviewTab = ({ lead, onEditRequest }: LeadOverviewTabProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(lead?.assignedToId || "unassigned");
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [uploadedContract, setUploadedContract] = useState<UploadedContract | null>(null);
  const [isUploadingContract, setIsUploadingContract] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch contract status for this lead
  useEffect(() => {
    const fetchContractStatus = async () => {
      if (!lead?.email) return;
      
      setIsLoadingContract(true);
      try {
        const response = await fetch(`/api/docuseal/submissions?email=${encodeURIComponent(lead.email)}`);
        if (response.ok) {
          const data = await response.json();
          // Handle the correct DocuSeal API response structure
          if (data.data && data.data.length > 0) {
            const mostRecent = data.data.sort((a: ContractStatus, b: ContractStatus) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            setContractStatus(mostRecent);
          }
        }
      } catch (error) {
        console.error('Error fetching contract status:', error);
      } finally {
        setIsLoadingContract(false);
      }
    };

    fetchContractStatus();
  }, [lead?.email]);

  // Fetch users that can be assigned
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const result = await getAssignableUsersAction();
        if (result.success) {
          setUsers(result.users);
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to load users",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Update the selected assignee when the lead data changes
  useEffect(() => {
    if (lead) {
      setSelectedAssignee(lead.assignedToId || "unassigned");
    }
  }, [lead?.assignedToId]);

  const handleAssigneeChange = async (userId: string) => {
    if (!lead || userId === selectedAssignee) return;
    
    setIsUpdatingAssignee(true);
    setSelectedAssignee(userId);
    
    try {
      // If "unassigned" is selected, pass null or empty string to the server action
      const assigneeId = userId === "unassigned" ? "" : userId;
      const result = await updateLeadAssigneeAction(lead.id, assigneeId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Lead assignee updated successfully",
        });
      } else {
        // Revert selection on error
        setSelectedAssignee(lead.assignedToId || "unassigned");
        toast({
          title: "Error",
          description: result.message || "Failed to update assignee",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating assignee:", error);
      // Revert selection on error
      setSelectedAssignee(lead.assignedToId || "unassigned");
      toast({
        title: "Error",
        description: "Failed to update assignee",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  // Fix the email button click handler
  const handleEmailClick = (email: string) => {
    window.location.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
  };

  const handleViewContract = async () => {
    if (!contractStatus || !lead) return;
    
    try {
      // First, try to get detailed submission info to find the document
      const detailsResponse = await fetch(`/api/docuseal/submissions/${contractStatus.id}`);
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        
        // Check if documents are embedded in the submission details
        if (details.documents && details.documents.length > 0) {
          const documentUrl = details.documents[0].url;
          window.open(documentUrl, '_blank');
          return;
        }
      }
      
      // Fallback: Try the documents endpoint
      const documentsResponse = await fetch(`/api/docuseal/submissions/${contractStatus.id}/documents`);
      if (documentsResponse.ok) {
        const documents = await documentsResponse.json();
        if (documents && documents.length > 0) {
          const documentUrl = documents[0].url;
          window.open(documentUrl, '_blank');
          return;
        }
      }
      
      // If no document found, show audit log
      if (contractStatus.audit_log_url) {
        window.open(contractStatus.audit_log_url, '_blank');
      } else {
        toast({
          title: "Contract not available",
          description: "Unable to retrieve the contract document.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error viewing contract:', error);
      toast({
        title: "Error",
        description: "Failed to open contract document.",
        variant: "destructive",
      });
    }
  };

  const handleUploadContract = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lead) return;

    setIsUploadingContract(true);
    
    try {
      // Upload file to shared drive
      const formData = new FormData();
      formData.append('file', file);
      formData.append('leadId', lead.id);
      formData.append('fileType', 'file'); // This will go to the Files section

      const response = await fetch('/api/files/upload-to-shared-drive', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        // Set uploaded contract state
        setUploadedContract({
          url: result.file?.webViewLink || result.file?.url || '#',
          name: file.name,
          uploadedAt: new Date().toISOString()
        });

        toast({
          title: "Success",
          description: "Contract uploaded successfully!",
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading contract:', error);
      toast({
        title: "Error",
        description: "Failed to upload contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingContract(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewUploadedContract = () => {
    if (uploadedContract?.url) {
      window.open(uploadedContract.url, '_blank');
    }
  };

  if (!lead) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm card">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
              <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4 sm:px-6 sm:pb-5">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const createdDate = lead.createdAt ? new Date(lead.createdAt) : null;
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "N/A";
  const addressDisplay = lead.address || "No address provided";

  // const getInitials = ...; // No longer needed

  return (
    <Card className="shadow-lg w-full border-0">
      <CardContent className="space-y-1 p-1">
        {/* Lead Summary Section */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-white">Lead Summary</h3>
          <div className="space-y-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              {createdDate && isValid(createdDate) ? (
                <>
                  <p className="text-sm" title={createdDate.toISOString()}>{format(createdDate, "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(createdDate, { addSuffix: true })}
                  </p>
                </>
              ) : <p className="text-sm text-muted-foreground">Invalid date</p>}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">SalesPerson</p>
              <div className="relative max-w-sm">
                <Select 
                  value={selectedAssignee} 
                  onValueChange={handleAssigneeChange}
                  disabled={isLoadingUsers || isUpdatingAssignee}
                >
                  <SelectTrigger className="h-9 text-sm w-1/2">
                    <SelectValue placeholder="Select salesperson">
                      {isLoadingUsers ? "Loading..." : isUpdatingAssignee ? "Updating..." : (selectedAssignee === "unassigned" ? "Unassigned" : users.find(user => user.id === selectedAssignee)?.name || 'Unassigned')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isUpdatingAssignee && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            {/* Contract Status */}
            {(contractStatus || isLoadingContract || uploadedContract) && (
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">Contract</p>
                {isLoadingContract ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : contractStatus ? (
                  <div className="flex items-center gap-2">
                    <Badge className={`border w-fit ${getContractStatusColor(contractStatus.status)}`}>
                      {getContractStatusIcon(contractStatus.status)}
                      <span className="ml-1 capitalize">
                        {contractStatus.status === 'sent' ? 'pending' : contractStatus.status}
                      </span>
                    </Badge>
                    {contractStatus.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewContract}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Contract
                      </Button>
                    )}
                  </div>
                ) : uploadedContract ? (
                  <div className="flex items-center gap-2">
                    <Badge className={`border w-fit ${getContractStatusColor('completed')}`}>
                      {getContractStatusIcon('completed')}
                      <span className="ml-1 capitalize">completed</span>
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewUploadedContract}
                      className="h-6 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Contract
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
            {/* Upload Contract Button - Show only when no contract exists */}
            {!contractStatus && !uploadedContract && !isLoadingContract && (
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-muted-foreground">Contract</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadContract}
                  disabled={isUploadingContract}
                  className="h-8 px-3 text-xs"
                >
                  {isUploadingContract ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 mr-1" />
                      Upload Contract
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  aria-label="Upload contract file"
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Contact Information</h3>
            {onEditRequest && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditRequest('contact')}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Contact</span>
              </Button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-base">{fullName}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-muted-foreground break-all">{lead.email || "No email"}</p>
                {lead.email && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEmailClick(lead.email!)}>
                    <Mail className="h-3 w-3" />
                    <span className="sr-only">Email</span>
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 pt-1">
              <ContactItem label="Phone" value={lead.phone} type="phone" />
              <ContactItem label="Address" value={addressDisplay !== "No address provided" ? addressDisplay : null} type="address" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Insurance Details Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Insurance Details</h3>
            {onEditRequest && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditRequest('insurance')}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Insurance</span>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Company</p>
              <p className="text-sm">{lead.insuranceCompany || "N/A"}</p>
            </div>
            <ContactItem label="Ins. Phone" value={lead.insurancePhone} type="phone" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Damage Type</p>
              <p className="text-sm">{lead.damageType || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Claim Number</p>
              <p className="text-sm">{lead.claimNumber || "N/A"}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Adjuster Details Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Adjuster Details</h3>
            {onEditRequest && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditRequest('adjuster')}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Adjuster</span>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Adjuster Name</p>
              <p className="text-sm">{lead.insuranceAdjusterName || "N/A"}</p>
            </div>
            <ContactItem label="Adjuster Phone" value={lead.insuranceAdjusterPhone} type="phone" />
            <ContactItem label="Adjuster Email" value={lead.insuranceAdjusterEmail} type="email" className="col-span-2" />
            <div className="space-y-0.5 col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Next Appointment</p>
              <p className="text-sm">
                {lead.adjusterAppointmentDate && isValid(new Date(lead.adjusterAppointmentDate)) 
                  ? format(new Date(lead.adjusterAppointmentDate), "MMM d, yyyy") + (lead.adjusterAppointmentTime ? ` at ${format(parse(lead.adjusterAppointmentTime, "HH:mm", new Date()), "h:mm a")}` : '')
                  : "No appointment"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 