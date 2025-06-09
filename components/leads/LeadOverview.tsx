"use client"

import { formatDistanceToNow, format, isValid, parse } from "date-fns"
import { useState, useEffect } from "react"
import type { Lead } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Check, Loader2, Phone, Mail, MapPin } from "lucide-react"
import { formatStatusLabel } from "@/lib/utils"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Avatar removed
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
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

interface LeadOverviewProps {
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

export function LeadOverview({ lead, onEditRequest }: LeadOverviewProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(lead?.assignedToId || "unassigned");

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
    <Card className="shadow-sm card w-full">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Lead Summary Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Summary</h3>
            <div className="space-y-2">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Created</p>
                {createdDate && isValid(createdDate) ? (
                  <>
                    <p className="text-xs">{format(createdDate, "MMM d, yyyy")}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(createdDate, { addSuffix: true })}
                    </p>
                  </>
                ) : <p className="text-xs text-muted-foreground">Invalid date</p>}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">SalesPerson</p>
                <div className="relative">
                  <Select 
                    value={selectedAssignee} 
                    onValueChange={handleAssigneeChange}
                    disabled={isLoadingUsers || isUpdatingAssignee}
                  >
                    <SelectTrigger className="h-7 text-xs w-full">
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
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Information Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-sm">{fullName}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground break-all">{lead.email || "No email"}</p>
                  {lead.email && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-lime-500/10 text-lime-500 hover:text-lime-600" onClick={() => handleEmailClick(lead.email!)}>
                      <Mail className="h-3 w-3 text-lime-500" />
                      <span className="sr-only">Send email</span>
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 pt-1">
                <ContactItem label="Phone" value={lead.phone} type="phone" />
              </div>
            </div>
          </div>
          
          {/* Insurance Information Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Insurance</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Company</p>
                <p className="text-xs">{lead.insuranceCompany || "N/A"}</p>
              </div>
              <ContactItem label="Ins. Phone" value={lead.insurancePhone} type="phone" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Damage Type</p>
                <p className="text-xs">{lead.damageType || "N/A"}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Claim Number</p>
                <p className="text-xs">{lead.claimNumber || "N/A"}</p>
              </div>
            </div>
          </div>
          
          {/* Adjuster Information Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Adjuster</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Adjuster Name</p>
                <p className="text-xs">{lead.insuranceAdjusterName || "N/A"}</p>
              </div>
              <ContactItem label="Adjuster Phone" value={lead.insuranceAdjusterPhone} type="phone" />
              <ContactItem label="Adjuster Email" value={lead.insuranceAdjusterEmail} type="email" className="col-span-2" />
              <div className="space-y-0.5 col-span-2">
                <p className="text-xs font-medium text-muted-foreground">Next Appointment</p>
                <p className="text-xs">
                  {lead.adjusterAppointmentDate && isValid(new Date(lead.adjusterAppointmentDate)) 
                    ? format(new Date(lead.adjusterAppointmentDate), "MMM d, yyyy") +
                      (lead.adjusterAppointmentTime 
                        ? ` at ${format(parse(lead.adjusterAppointmentTime || "", "HH:mm", new Date()), "h:mm a")}`
                        : '')
                    : "No appointment"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 