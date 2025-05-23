"use client"

import { formatDistanceToNow, format, isValid, parse } from "date-fns"
import { useState, useEffect } from "react"
import type { Lead } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Check, Loader2 } from "lucide-react"
import { formatStatusLabel } from "@/lib/utils"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Avatar removed
import { Badge } from "@/components/ui/badge"
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

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface LeadOverviewTabProps {
  lead: (Lead & { assignedTo?: { name?: string | null } | null }) | null;
  onEditRequest?: (section: 'contact' | 'insurance' | 'adjuster') => void;
}

export function LeadOverviewTab({ lead, onEditRequest }: LeadOverviewTabProps) {
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
    // Use a more flexible grid that attempts 2 columns, but can shrink to 1 if necessary.
    // Adjust gap and padding for smaller screens.
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 md:gap-6">
      {/* Lead Summary Card */}
      <Card className="shadow-sm card">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-md sm:text-lg">Lead Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="space-y-2">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={lead.status as any} className="text-xs px-1.5 py-0.5 sm:text-sm sm:px-2 sm:py-1">{formatStatusLabel(lead.status)}</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Created</p>
              {createdDate && isValid(createdDate) ? (
                <>
                  <p className="text-xs sm:text-sm" title={createdDate.toISOString()}>{format(createdDate, "MMM d, yyyy")}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {formatDistanceToNow(createdDate, { addSuffix: true })}
                  </p>
                </>
              ) : <p className="text-xs sm:text-sm text-muted-foreground">Invalid date</p>}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">SalesPerson</p>
              <div className="relative">
                <Select 
                  value={selectedAssignee} 
                  onValueChange={handleAssigneeChange}
                  disabled={isLoadingUsers || isUpdatingAssignee}
                >
                  <SelectTrigger className="h-8 text-xs sm:text-sm w-full">
                    <SelectValue placeholder="Select salesperson">
                      {isLoadingUsers ? (
                        "Loading users..."
                      ) : isUpdatingAssignee ? (
                        "Updating..."
                      ) : (
                        selectedAssignee === "unassigned" 
                          ? "Unassigned" 
                          : users.find(user => user.id === selectedAssignee)?.name || 'Unassigned'
                      )}
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
        </CardContent>
      </Card>
      
      {/* Contact Information Card */}
      <Card className="shadow-sm card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-md sm:text-lg">Contact Information</CardTitle>
          {onEditRequest && (
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7" onClick={() => onEditRequest('contact')}>
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only">Edit Contact Information</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5">
          {/* Avatar removed */}
          <div>
            <p className="font-medium text-sm sm:text-base">{fullName}</p>
            <p className="text-xs sm:text-sm text-muted-foreground break-all">{lead.email || "No email"}</p>
          </div>
          
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-xs sm:text-sm">{lead.phone || "No phone"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-xs sm:text-sm">{addressDisplay}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Insurance Information Card */}
      <Card className="shadow-sm card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-md sm:text-lg">Insurance Details</CardTitle>
          {onEditRequest && (
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7" onClick={() => onEditRequest('insurance')}>
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only">Edit Insurance Details</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Company</p>
              <p className="text-xs sm:text-sm">{lead.insuranceCompany || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ins. Phone</p>
              <p className="text-xs sm:text-sm">{lead.insurancePhone || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Damage Type</p>
              <p className="text-xs sm:text-sm">{lead.damageType || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Claim Number</p>
              <p className="text-xs sm:text-sm">{lead.claimNumber || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Adjuster Information Card */}
      <Card className="shadow-sm card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4 sm:px-6">
          <CardTitle className="text-md sm:text-lg">Adjuster Details</CardTitle>
          {onEditRequest && (
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7" onClick={() => onEditRequest('adjuster')}>
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only">Edit Adjuster Details</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-2">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Adjuster Name</p>
              <p className="text-xs sm:text-sm">{lead.insuranceAdjusterName || "N/A"}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Adjuster Phone</p>
              <p className="text-xs sm:text-sm">{lead.insuranceAdjusterPhone || "N/A"}</p>
            </div>
            <div className="space-y-0.5 col-span-1 sm:col-span-2">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Adjuster Email</p>
              <p className="text-xs sm:text-sm break-all">{lead.insuranceAdjusterEmail || "N/A"}</p>
            </div>
            <div className="space-y-0.5 col-span-1 sm:col-span-2">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Next Appointment</p>
              <p className="text-xs sm:text-sm">
                {lead.adjusterAppointmentDate && isValid(new Date(lead.adjusterAppointmentDate)) 
                  ? format(new Date(lead.adjusterAppointmentDate), "MMM d, yyyy") +
                    (lead.adjusterAppointmentTime 
                      ? ` at ${format(parse(lead.adjusterAppointmentTime, "HH:mm", new Date()), "h:mm a")}`
                      : '')
                  : "No appointment"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 