"use client"

import { formatDistanceToNow, format, isValid, parse } from "date-fns"
import { useState, useEffect, useRef } from "react"
import type { Lead } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Check, Loader2, Phone, Mail, MapPin, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink, FileText, Eye, Upload, Trash2, Calendar as CalendarIcon } from "lucide-react"
import { formatStatusLabel } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useWindowSize } from "@/hooks/use-window-size"
import ReactConfetti from "react-confetti"

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
  type: 'phone' | 'email' | 'address' | 'date';
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
      case 'date':
        // Date type doesn't need navigation
        break;
    }
  };

  const icon = {
    phone: <Phone className="h-3 w-3 text-lime-500" />,
    email: <Mail className="h-3 w-3 text-lime-500" />,
    address: <MapPin className="h-3 w-3 text-lime-500" />,
    date: null
  }[type];

  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-xs sm:text-sm">{value}</p>
        {icon && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:bg-lime-500/10 text-lime-500 hover:text-lime-600"
            onClick={handleClick}
          >
            {icon}
            <span className="sr-only">Contact via {type}</span>
          </Button>
        )}
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
  const { width, height } = useWindowSize();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(lead?.assignedToId || "unassigned");
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [uploadedContract, setUploadedContract] = useState<UploadedContract | null>(null);
  const [isUploadingContract, setIsUploadingContract] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Additional upload handling for other lead summary documents
  const [currentUploadType, setCurrentUploadType] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const genericFileInputRef = useRef<HTMLInputElement>(null);
  // Track uploaded files status for each category
  const [uploadedFileStatus, setUploadedFileStatus] = useState<Record<string, boolean>>({});
  const [isCheckingFiles, setIsCheckingFiles] = useState<Record<string, boolean>>({});
  const [uploadedFileUrls, setUploadedFileUrls] = useState<Record<string, string>>({});
  const [isDeletingFile, setIsDeletingFile] = useState<Record<string, boolean>>({});
  
  // New state for enhanced upload experience
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentUploadFileName, setCurrentUploadFileName] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);

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

  /* ---------------------------------
   * Generic file upload for summary docs
   * ---------------------------------*/
  const handleUploadFile = (fileType: string) => {
    setCurrentUploadType(fileType);
    genericFileInputRef.current?.click();
  };

  // Delete file function
  const handleDeleteFile = async (fileType: string) => {
    if (!lead?.id) return;
    
    setIsDeletingFile(prev => ({ ...prev, [fileType]: true }));
    
    try {
      // Get the file ID first by checking what files exist
      const response = await fetch(`/api/files/check-file-exists?leadId=${lead.id}&fileType=${fileType}`);
      if (!response.ok) {
        throw new Error('Failed to find file');
      }
      
      const checkData = await response.json();
      if (!checkData.exists || !checkData.fileId) {
        throw new Error('File not found');
      }
      
      // Delete the file using the actual Google Drive file ID
      const deleteResponse = await fetch(`/api/files/delete-from-shared-drive?driveFileId=${checkData.fileId}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      
      // Update local state
      setUploadedFileStatus(prev => ({ ...prev, [fileType]: false }));
      setUploadedFileUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[fileType];
        return newUrls;
      });
      
      toast({
        title: "Success",
        description: `${fileType} deleted successfully!`,
      });
      
    } catch (error) {
      console.error(`Error deleting ${fileType}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${fileType}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsDeletingFile(prev => ({ ...prev, [fileType]: false }));
    }
  };

  // Check if files exist for each category
  const checkFileExists = async (fileType: string) => {
    if (!lead?.id) return { exists: false, fileUrl: null, fileId: null };
    
    try {
      const response = await fetch(`/api/files/check-file-exists?leadId=${lead.id}&fileType=${fileType}`);
      if (response.ok) {
        const data = await response.json();
        return { exists: data.exists, fileUrl: data.fileUrl, fileId: data.fileId };
      }
    } catch (error) {
      console.error(`Error checking ${fileType} file:`, error);
    }
    return { exists: false, fileUrl: null, fileId: null };
  };

  // Check all file types on component mount and when lead changes
  useEffect(() => {
    const checkAllFiles = async () => {
      if (!lead?.id) return;
      
      const fileTypes = ['estimate', 'acv', 'supplement', 'eagleview', 'scope_of_work', 'warrenty'];
      const statusChecks = await Promise.all(
        fileTypes.map(async (fileType) => {
          const result = await checkFileExists(fileType);
          return { fileType, exists: result.exists, fileUrl: result.fileUrl, fileId: result.fileId };
        })
      );
      
      const newStatus: Record<string, boolean> = {};
      const newUrls: Record<string, string> = {};
      statusChecks.forEach(({ fileType, exists, fileUrl }) => {
        newStatus[fileType] = exists;
        if (exists && fileUrl) {
          newUrls[fileType] = fileUrl;
        }
      });
      
      setUploadedFileStatus(newStatus);
      setUploadedFileUrls(newUrls);
    };

    checkAllFiles();
  }, [lead?.id]);

  const handleGenericFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lead || !currentUploadType) return;

    console.log('🚀 Starting upload process:', {
      fileName: file.name,
      fileType: file.type,
      currentUploadType,
      leadId: lead.id,
      leadName: [lead.firstName, lead.lastName].filter(Boolean).join("_")
    });

    // Show upload dialog and reset progress
    setCurrentUploadFileName(file.name);
    setUploadProgress(0);
    setShowUploadDialog(true);
    setIsUploadingFile(true);
    setIsCheckingFiles(prev => ({ ...prev, [currentUploadType]: false }));

    try {
      // Get file extension
      const fileExtension = file.name.split('.').pop();
      
      // Create lead name from first and last name, or use ID if names not available
      const leadName = [lead.firstName, lead.lastName]
        .filter(Boolean)
        .join("_")
        .replace(/[^a-zA-Z0-9_]/g, "") || lead.id;
      
      // Create new filename in the format: ButtonName/LeadName/LeadId.extension
      const newFileName = `${currentUploadType}/${leadName}/${lead.id}.${fileExtension}`;

      console.log('📝 Generated filename:', newFileName);

      const formData = new FormData();
      // Create a new File object with the new name
      const renamedFile = new File([file], newFileName, { type: file.type });
      formData.append("file", renamedFile);
      formData.append("leadId", lead.id);
      formData.append("fileType", currentUploadType);
      // Add the custom filename to be used server-side
      formData.append("customFileName", newFileName);

      console.log('📤 Sending to API:', {
        originalFileName: file.name,
        renamedFileName: newFileName,
        leadId: lead.id,
        fileType: currentUploadType,
        customFileName: newFileName
      });

      // Create XMLHttpRequest for accurate progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `HTTP ${xhr.status}`));
            } catch (e) {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        xhr.open('POST', '/api/files/upload-to-shared-drive');
        xhr.send(formData);
      });

      const result = await uploadPromise;
      console.log('✅ API Success:', result);

      if (result.success) {
        // Store the file URL for link preview
        if (result.file?.webViewLink) {
          setUploadedFileUrls(prev => ({ 
            ...prev, 
            [currentUploadType]: result.file.webViewLink 
          }));
        }

        // Show success message
        toast({
          title: "Success",
          description: `${currentUploadType} uploaded successfully!`,
        });
        
        // Show confetti animation
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        
        // Start checking for file confirmation
        setIsCheckingFiles(prev => ({ ...prev, [currentUploadType]: true }));
        
        // Check if file exists in Google Drive (with retry logic)
        let retryCount = 0;
        const maxRetries = 10;
        const checkInterval = setInterval(async () => {
          console.log(`🔍 Checking file existence (attempt ${retryCount + 1}/${maxRetries})`);
          const result = await checkFileExists(currentUploadType);
          console.log(`📁 File exists: ${result.exists}`);
          if (result.exists) {
            setUploadedFileStatus(prev => ({ ...prev, [currentUploadType]: true }));
            if (result.fileUrl) {
              setUploadedFileUrls(prev => ({ ...prev, [currentUploadType]: result.fileUrl }));
            }
            setIsCheckingFiles(prev => ({ ...prev, [currentUploadType]: false }));
            clearInterval(checkInterval);
          } else if (retryCount >= maxRetries) {
            console.log('⏰ Max retries reached, stopping check');
            setIsCheckingFiles(prev => ({ ...prev, [currentUploadType]: false }));
            clearInterval(checkInterval);
          }
          retryCount++;
        }, 2000); // Check every 2 seconds
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: `Failed to upload ${currentUploadType}. Please try again.`,
        variant: "destructive",
      });
      setIsCheckingFiles(prev => ({ ...prev, [currentUploadType]: false }));
    } finally {
      setIsUploadingFile(false);
      setCurrentUploadType(null);
      if (genericFileInputRef.current) genericFileInputRef.current.value = "";
      
      // Hide upload dialog after a short delay
      setTimeout(() => {
        setShowUploadDialog(false);
        setUploadProgress(0);
        setCurrentUploadFileName("");
      }, 2000);
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
    <>
    <Card className="shadow-lg w-full border-0">
      <CardContent className="space-y-1 p-1">
        {/* Lead Summary Section */}
        <div className="space-y-2 pb-4">
          <div className="flex justify-center items-center">
            <h3 className="text-lg font-medium text-white">Lead Summary</h3>
          </div>
          {/* Two-column layout: details (col 1) + upload buttons (col 2) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Column 1 – Existing details */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-blue-400">Created</p>
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
                <p className="text-sm font-medium text-blue-400">SalesPerson</p>
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
                  <p className="text-sm font-medium text-blue-400">Contract</p>
                  {isLoadingContract ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : contractStatus ? (
                    <div className="flex flex-col gap-2">
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
                          className="h-6 px-2 text-xs w-fit"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Contract
                        </Button>
                      )}
                    </div>
                  ) : uploadedContract ? (
                    <div className="flex flex-col gap-2">
                      <Badge className={`border w-fit ${getContractStatusColor('completed')}`}>
                        {getContractStatusIcon('completed')}
                        <span className="ml-1 capitalize">completed</span>
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewUploadedContract}
                        className="h-6 px-2 text-xs w-fit"
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
                  <p className="text-sm font-medium text-blue-400">Contract</p>
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

            {/* Column 2 – Additional document uploads */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-blue-400 mb-2">Upload to Drive</p>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { key: "estimate", label: "Estimate" },
                  { key: "acv", label: "ACV" },
                  { key: "supplement", label: "Supplement" },
                  { key: "eagleview", label: "EagleView" },
                  { key: "scope_of_work", label: "SOW" },
                  { key: "warrenty", label: "Warranty" },
                ].map(({ key, label }) => (
                  <div key={key} className="relative group">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUploadFile(key)}
                      disabled={isUploadingFile}
                      className={`h-12 sm:h-10 px-1 sm:px-2 text-[10px] sm:text-md w-full rounded-xl border-gray-300/40 bg-black text-white hover:bg-gray-800 flex flex-col sm:flex-row items-center pt-4 justify-center gap-0.5 sm:gap-1 transition-all duration-200 ${
                        uploadedFileStatus[key] ? 'border-lime-500/70' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 flex-1 min-w-0">
                        {isUploadingFile && currentUploadType === key ? (
                          <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                        ) : isCheckingFiles[key] ? (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500 flex-shrink-0" />
                        ) : null}
                        <span className="truncate text-center sm:text-left text-[9px] sm:text-xs leading-tight">{label}</span>
                      </div>
                      
                      {/* Green checkmark on the right when uploaded */}
                      {uploadedFileStatus[key] && (
                        <CheckCircle2 className="h-3 w-3 text-green-500 absolute top-1 right-1 flex-shrink-0" />
                      )}
                    </Button>
                    
                    {/* Hover overlay with View and Delete buttons */}
                    {uploadedFileStatus[key] && (
                      <div className="absolute inset-0 bg-black/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 sm:gap-2 z-10">
                        {uploadedFileUrls[key] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(uploadedFileUrls[key], '_blank');
                            }}
                            className="h-8 sm:h-7 px-2 sm:px-2 text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 hover:bg-black/20"
                          >
                            <Eye className="h-3 w-3 mr-0.5 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(key);
                          }}
                          disabled={isDeletingFile[key]}
                          className="h-8 sm:h-7 px-2 sm:px-2 text-[10px] sm:text-xs text-red-400 hover:text-red-300 hover:bg-black/20"
                        >
                          {isDeletingFile[key] ? (
                            <Loader2 className="h-3 w-3 mr-0.5 sm:mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-0.5 sm:mr-1" />
                          )}
                          <span className="hidden sm:inline">{isDeletingFile[key] ? 'Deleting...' : 'Delete'}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Generic hidden input for uploads */}
              <input
                ref={genericFileInputRef}
                type="file"
                onChange={handleGenericFileChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
                aria-label="Upload document"
              />
            </div>
          </div>
        </div>
      
        {/* Custom gradient divider */}
        <div className="h-px bg-gradient-to-r from-black via-lime-400 to-black my-4"></div>
        
        <div className="space-y-2 pb-4">
          <div className="flex justify-center items-center relative">
            <h3 className="text-lg mt-4 font-medium text-white">Contact Information</h3>
            {onEditRequest && (
              <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-0" onClick={() => onEditRequest('contact')}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Contact</span>
              </Button>
            )}
          </div>
          <div className="space-y-1">
            <div>
              <p className="font-medium text-base">{fullName}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm text- break-all">{lead.email || "No email"}</p>
                {lead.email && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEmailClick(lead.email!)}>
                    <Mail className="h-3 w-3" />
                    <span className="sr-only">Email</span>
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1 pt-1">
              <ContactItem label="Phone" value={lead.phone} type="phone" />
              <ContactItem label="Address" value={addressDisplay !== "No address provided" ? addressDisplay : null} type="address" />
            </div>
          </div>
        </div>

        {/* Custom gradient divider */}
        <div className="h-px bg-gradient-to-r from-black via-lime-400 to-black my-6"></div>

        {/* Insurance Details Section */}
        <div className="space-y-4 pb-4">
          <div className="flex justify-center items-center relative">
            <h3 className="text-lg mt-4 font-medium text-white">Insurance Details</h3>
            {onEditRequest && (
              <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-0" onClick={() => onEditRequest('insurance')}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Insurance</span>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

        {/* Custom gradient divider */}
        <div className="h-px bg-gradient-to-r from-black via-lime-400 to-black my-6"></div>

        {/* Adjuster Details Section */}
        <div className="space-y-4 pb-4">
          <div className="flex justify-center items-center relative">
            <h3 className="text-lg mt-4 font-medium text-white">Adjuster Details</h3>
            {onEditRequest && (
              <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-0" onClick={() => onEditRequest('adjuster')}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit Adjuster</span>
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Adjuster Name</p>
              <p className="text-sm">{lead.insuranceAdjusterName || "N/A"}</p>
            </div>
            <ContactItem label="Adjuster Phone" value={lead.insuranceAdjusterPhone} type="phone" />
            <ContactItem label="Adjuster Email" value={lead.insuranceAdjusterEmail} type="email" className="sm:col-span-2" />
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Upload Progress Dialog */}
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Uploading File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Uploading: {currentUploadFileName}
            </p>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-muted-foreground mt-1">
              {uploadProgress}% complete
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Confetti Animation */}
    {showConfetti && (
      <ReactConfetti
        width={width}
        height={height}
        numberOfPieces={100}
        recycle={false}
        gravity={0.3}
      />
    )}
    </>
  )
} 