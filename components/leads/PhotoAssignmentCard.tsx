"use client";

import { useState, useEffect } from "react";
import { Lead } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, CheckCircle, Phone, Users, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PhotoAssignmentCardProps {
  lead: Lead;
}

interface RoofingCrew {
  id: string;
  name: string;
  phone: string;
}

const roofingCrews: RoofingCrew[] = [
  {
    id: "fish-jc",
    name: "Fish Jc Construction Services",
    phone: "7344869890"
  },
  {
    id: "osso-homes",
    name: "Osso Homes LLC",
    phone: "3137994479"
  }
  // Add more crews here as needed
];

export function PhotoAssignmentCard({ lead }: PhotoAssignmentCardProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<string>("");
  const [customPhone, setCustomPhone] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<"crew" | "custom">("crew");
  const [notes, setNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [hasPhotoAssignment, setHasPhotoAssignment] = useState(false);
  const [assignedContractorName, setAssignedContractorName] = useState<string>("");
  const [isCheckingAssignment, setIsCheckingAssignment] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState<string>("");
  const [isUnassigning, setIsUnassigning] = useState(false);

  const borderClass = hasPhotoAssignment
    ? "border-green-500 border-2"
    : "border-gray-700";

  // Check for existing photo assignment on component load
  useEffect(() => {
    const checkExistingAssignment = async () => {
      try {
        const response = await fetch(`/api/photo-assignments?leadId=${lead.id}`);
        const result = await response.json();
        
        if (response.ok && result.assignments && result.assignments.length > 0) {
          const assignment = result.assignments[0]; // Get the most recent assignment
          console.log('Found existing assignment:', assignment);
          setHasPhotoAssignment(true);
          setCurrentAssignmentId(assignment.id);
          
          // Try to find contractor name from our predefined crews
          const crew = roofingCrews.find(c => c.phone === assignment.contractorPhone);
          if (crew) {
            setAssignedContractorName(crew.name);
          } else {
            setAssignedContractorName(`Phone: ${assignment.contractorPhone}`);
          }
        }
        
        // Fetch photo count for this lead
        const photoResponse = await fetch(`/api/leads/${lead.id}/photos`);
        if (photoResponse.ok) {
          const photoResult = await photoResponse.json();
          setPhotoCount(photoResult.photos?.length || 0);
        }
      } catch (error) {
        console.error('Error checking existing photo assignment:', error);
      } finally {
        setIsCheckingAssignment(false);
      }
    };

    checkExistingAssignment();
  }, [lead.id]);

  const openModal = () => {
    if (!hasPhotoAssignment) {
      setIsEditMode(false);
      setIsModalOpen(true);
    } else {
      setIsEditMode(true);
      setIsModalOpen(true);
    }
  };

  const handleUnassign = async () => {
    setIsUnassigning(true);
    try {
      console.log('Attempting to unassign with ID:', currentAssignmentId);
      
      const response = await fetch(`/api/photo-assignments?assignmentId=${currentAssignmentId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      console.log('Unassign response:', { status: response.status, result });

      if (response.ok) {
        toast({
          title: "✅ Roofer unassigned successfully!",
          description: "The photo assignment has been removed."
        });
        
        // Reset state
        setHasPhotoAssignment(false);
        setAssignedContractorName("");
        setCurrentAssignmentId("");
        setIsModalOpen(false);
      } else {
        throw new Error(result.error || 'Failed to unassign roofer');
      }
    } catch (error) {
      console.error('Error unassigning roofer:', error);
      toast({
        title: "Error unassigning roofer",
        description: error instanceof Error ? error.message : "Failed to remove assignment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleAssign = async () => {
    let contractorPhone = "";
    let contractorName = "";

    if (assignmentType === "crew") {
      if (!selectedCrew) {
        toast({ 
          title: "Select a roofing crew", 
          variant: "destructive" 
        });
        return;
      }

      const crew = roofingCrews.find(c => c.id === selectedCrew);
      if (!crew) return;

      contractorPhone = crew.phone;
      contractorName = crew.name;
    } else {
      if (!customPhone.trim()) {
        toast({ 
          title: "Enter a phone number", 
          variant: "destructive" 
        });
        return;
      }

      // Clean phone number - remove all non-digit characters
      contractorPhone = customPhone.replace(/\D/g, '');
      
      // Basic validation for phone number
      if (contractorPhone.length < 10) {
        toast({ 
          title: "Invalid phone number", 
          description: "Please enter a valid 10-digit phone number.",
          variant: "destructive" 
        });
        return;
      }

      contractorName = `Contractor (${contractorPhone})`;
    }

    setIsAssigning(true);
    try {
      const response = await fetch('/api/photo-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          contractorPhone,
          notes: notes.trim() || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          details: result.details
        });
        throw new Error(result.error || 'Failed to assign roofer');
      }

      toast({
        title: "✅ Roofer assigned successfully!",
        description: `${contractorName} has been assigned to take photos for ${lead.address || 'this lead'}.`
      });

      // Update state to show assigned status
      setHasPhotoAssignment(true);
      setAssignedContractorName(contractorName);
      
      // Reset form and close modal
      setSelectedCrew("");
      setCustomPhone("");
      setAssignmentType("crew");
      setNotes("");
      setIsModalOpen(false);

    } catch (error) {
      console.error('Error assigning photo job:', error);
      toast({
        title: "Error assigning photo job",
        description: error instanceof Error ? error.message : "Failed to assign photo job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <>
      <div className="relative w-full">
        <Button
          onClick={openModal}
          disabled={isCheckingAssignment}
          className={cn(
            "w-full h-16 flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium transition-all duration-200 rounded-lg",
            hasPhotoAssignment 
              ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-400 shadow-lg"
              : "bg-gray-800/90 hover:bg-gray-700/90 text-white border-2 border-transparent hover:border-gray-600",
            isCheckingAssignment && "opacity-50 cursor-not-allowed",
            borderClass
          )}
        >
          {isCheckingAssignment ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : hasPhotoAssignment ? (
            <CheckCircle className="h-5 w-5 text-white" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          <span className="text-[10px] leading-tight">
            {isCheckingAssignment ? "Checking..." : hasPhotoAssignment ? "✅ Assigned" : "Assign Roofer"}
          </span>
        </Button>
        
        {/* Photo counter overlay */}
        {hasPhotoAssignment && photoCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {photoCount}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              {isEditMode ? <Edit className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              {isEditMode ? "Edit Assignment" : "Assign Roofer"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead-info" className="text-gray-900">Lead Information</Label>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>Address:</strong> {lead.address || "Not specified"}
                </p>
                {lead.claimNumber && (
                  <p className="text-sm text-gray-700">
                    <strong>Claim #:</strong> {lead.claimNumber}
                  </p>
                )}
                {isEditMode && (
                  <p className="text-sm text-gray-700">
                    <strong>Assigned to:</strong> {assignedContractorName}
                  </p>
                )}
                {isEditMode && photoCount > 0 && (
                  <p className="text-sm text-gray-700">
                    <strong>Photos:</strong> {photoCount} on file
                  </p>
                )}
                {isEditMode && (
                  <p className="text-xs text-gray-500">
                    <strong>Assignment ID:</strong> {currentAssignmentId}
                  </p>
                )}
              </div>
            </div>

            {isEditMode ? (
              // Edit mode - show options to edit or unassign
              <div className="space-y-3">
                <Label className="text-gray-900">Assignment Actions</Label>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      // TODO: Add call functionality
                      toast({
                        title: "Calling roofer...",
                        description: "This would initiate a call to the assigned roofer."
                      });
                    }}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call {assignedContractorName}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      console.log('Unassign button clicked!');
                      handleUnassign();
                    }}
                    variant="destructive"
                    disabled={isUnassigning}
                    className="w-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isUnassigning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Unassigning...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Unassign Roofer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Assignment mode - show the assignment form
              <>
                <div className="space-y-3">
              <Label className="text-gray-900">Assignment Type *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAssignmentType("crew");
                    setCustomPhone("");
                  }}
                  className={`flex-1 ${
                    assignmentType === "crew" 
                      ? "bg-green-500 text-black border-green-500 hover:bg-green-600 hover:text-black" 
                      : "bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Select Crew
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAssignmentType("custom");
                    setSelectedCrew("");
                  }}
                  className={`flex-1 ${
                    assignmentType === "custom" 
                      ? "bg-green-500 text-black border-green-500 hover:bg-green-600 hover:text-black" 
                      : "bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Enter Phone
                </Button>
              </div>

              {assignmentType === "crew" ? (
                <div className="space-y-2">
                  <Label htmlFor="crew-select" className="text-gray-900">
                    Select Roofing Crew *
                  </Label>
                  <Select value={selectedCrew} onValueChange={setSelectedCrew}>
                    <SelectTrigger className="bg-white border-gray-300 text-black focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                      <SelectValue placeholder="Choose a roofing crew..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-black">
                      {roofingCrews.map((crew) => (
                        <SelectItem 
                          key={crew.id} 
                          value={crew.id}
                          className="bg black text-white hover:bg-gray-100"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium bg black text-white">{crew.name}</span>
                            <span className="text-xs bg black text-white">{crew.phone}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="custom-phone" className="text-gray-900">
                    Phone Number *
                  </Label>
                  <Input
                    id="custom-phone"
                    type="tel"
                    placeholder="Enter 10-digit phone number (no spaces or dashes)"
                    value={customPhone}
                    onChange={(e) => {
                      // Remove all non-digit characters as user types
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setCustomPhone(cleaned);
                    }}
                    className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    maxLength={10}
                    disabled={isAssigning}
                  />
                  <p className="text-xs text-gray-500">
                    Enter phone number without parentheses, dashes, or spaces
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-900">
                Instructions (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions for the crew..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-h-[80px] resize-none"
                disabled={isAssigning}
              />
            </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isAssigning}
                  className="flex-1 bg-black text-white border-black hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssign}
                  disabled={isAssigning || (assignmentType === "crew" ? !selectedCrew : !customPhone.trim())}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Assign Roofer
                    </>
                  )}
                </Button>
              </div>
              </>
            )}

            {isEditMode && (
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-black text-white border-black hover:bg-gray-800 hover:text-white"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
