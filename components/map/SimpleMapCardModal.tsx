"use client"

import React, { useEffect, useRef, useState, CSSProperties } from "react"
import { PropertyVisitStatus } from "./types"
import { ChevronDown, ChevronUp, User, FileText, Clipboard, MessageSquare, MapPin, Sliders, Loader2, Save, ExternalLink, X, Maximize2, Minimize2 } from "lucide-react"
import { ContactForm } from "@/components/forms/ContactForm"
import { InsuranceForm } from "@/components/forms/InsuranceForm"
import { AdjusterForm } from "@/components/forms/AdjusterForm"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface SimpleMapCardModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  streetViewUrl?: string
  availableStatuses?: PropertyVisitStatus[]
  currentStatus?: PropertyVisitStatus
  onStatusChange: (status: PropertyVisitStatus) => void
  leadId?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  streetAddress?: string
  city?: string
  state?: string
  zipcode?: string
  insuranceCompany?: string
  insurancePolicyNumber?: string
  insurancePhone?: string
  insuranceAdjusterName?: string
  insuranceAdjusterPhone?: string
  insuranceAdjusterEmail?: string
  insuranceDeductible?: string
  insuranceSecondaryPhone?: string
  dateOfLoss?: string
  damageType?: string
  claimNumber?: string
  adjusterAppointmentDate?: string
  adjusterAppointmentTime?: string
  adjusterAppointmentNotes?: string
}

// Map status to colors with explicit colors for inline styles
const statusColors: Record<PropertyVisitStatus, string> = {
  "No Answer": "#3b82f6", // blue
  "Not Interested": "#ef4444", // red
  "Follow up": "#f59e0b", // amber
  "Inspected": "#22c55e", // green
  "In Contract": "#6366f1", // indigo
}

// Function to generate gradients for each button
const getButtonGradient = (status: string, baseColor: string): string => {
  switch (status) {
    case "Not Interested":
      return `linear-gradient(145deg, ${baseColor} 0%, #b91c1c 100%)`;
    case "Follow up":
      return `linear-gradient(145deg, ${baseColor} 0%, #d97706 100%)`;
    case "Inspected":
      return `linear-gradient(145deg, ${baseColor} 0%, #15803d 100%)`;
    case "In Contract":
      return `linear-gradient(145deg, ${baseColor} 0%, #4f46e5 100%)`;
    default:
      return `linear-gradient(145deg, ${baseColor} 0%, ${baseColor} 100%)`;
  }
};

// Create a schema for note form validation
const noteFormSchema = z.object({
  content: z.string().min(1, "Note content is required"),
})

type NoteFormValues = z.infer<typeof noteFormSchema>

export function SimpleMapCardModal({
  isOpen,
  onClose,
  address,
  streetViewUrl = "https://via.placeholder.com/600x300/cccccc/969696?text=Street+View+Not+Available",
  availableStatuses = ["No Answer", "Not Interested", "Follow up", "Inspected", "In Contract"],
  currentStatus,
  onStatusChange,
  leadId,
  firstName,
  lastName,
  email,
  phone,
  streetAddress,
  city,
  state,
  zipcode,
  insuranceCompany,
  insurancePolicyNumber,
  insurancePhone,
  insuranceAdjusterName,
  insuranceAdjusterPhone,
  insuranceAdjusterEmail,
  insuranceDeductible,
  insuranceSecondaryPhone,
  dateOfLoss,
  damageType,
  claimNumber,
  adjusterAppointmentDate,
  adjusterAppointmentTime,
  adjusterAppointmentNotes,
}: SimpleMapCardModalProps) {
  // Add state for button hover
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  // Add state for expanded accordion sections
  const [expandedSection, setExpandedSection] = useState<string | null>("streetview");
  // Add state for expanded/collapsed view mode
  const [isExpandedView, setIsExpandedView] = useState(false);
  const contractIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Notes form functionality
  const [noteHistory, setNoteHistory] = useState<Array<{id: string, content: string, date: string}>>([])
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null)
  
  const {
    handleSubmit: handleNoteSubmit,
    register: registerNote,
    reset: resetNote,
    formState: { errors: noteErrors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    }
  })
  
  // Load note history (mock data for now)
  useEffect(() => {
    if (expandedSection === "notes" && leadId) {
      // Reset states
      setNoteError(null)
      setNoteSuccess(null)
      
      // For demonstration, we're using mock data
      // In a real app, you would fetch notes from an API
      setNoteHistory([
        {
          id: '1',
          content: 'Initial contact made with homeowner. They mentioned hail damage on the north side of the roof.',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          content: 'Follow-up call scheduled for next week. Homeowner wants to involve their insurance company.',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
    }
  }, [expandedSection, leadId])
  
  // Function to save a new note
  const onSubmitNote = async (data: NoteFormValues) => {
    if (!leadId) return
    
    setIsSavingNote(true)
    setNoteError(null)
    setNoteSuccess(null)
    
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/leads/${leadId}/notes`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ content: data.content }),
      // })
      
      // For demonstration, we'll just mock the API response
      // Simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Create a new note
      const newNote = {
        id: Date.now().toString(),
        content: data.content,
        date: new Date().toISOString()
      }
      
      // Add to history
      setNoteHistory(prev => [newNote, ...prev])
      
      // Show success message
      setNoteSuccess("Note saved successfully")
      
      // Reset form
      resetNote()
    } catch (error) {
      setNoteError("Failed to save note. Please try again.")
      console.error("Error saving note:", error)
    } finally {
      setIsSavingNote(false)
      
      // Clear success message after 3 seconds
      if (noteSuccess) {
        const timer = setTimeout(() => setNoteSuccess(null), 3000)
        return () => clearTimeout(timer)
      }
    }
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
  }
  
  // Add responsive detection
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Don't render anything if not open
  if (!isOpen) {
    return null;
  }

  // Toggle an accordion section
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Toggle expanded/collapsed view
  const toggleExpandedView = () => {
    setIsExpandedView(!isExpandedView);
    // If switching to expanded view, reset accordion state
    if (!isExpandedView) {
      setExpandedSection("contact");
    }
  };

  // Animation variants for dialog content
  const contentVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", duration: 0.5 } },
    exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
        "sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] p-0 border-0",
        isExpandedView ? "md:max-h-[90vh]" : "md:max-h-[70vh]"
      )}>
        <DialogTitle className="sr-only">Property details for {address}</DialogTitle>
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={contentVariants}
          className="bg-background text-foreground rounded-lg overflow-hidden shadow-xl"
        >
          <Card className="border-0">
            <CardHeader className="bg-zinc-900 text-white p-4 flex flex-row justify-between items-center space-y-0">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-lime-500" />
                <CardTitle className="text-xl">{address}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleExpandedView}
                  className="text-white hover:bg-zinc-800 rounded-full"
                  aria-label={isExpandedView ? "Collapse modal" : "Expand modal"}
                >
                  {isExpandedView ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  className="text-white hover:bg-zinc-800 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {!isExpandedView ? (
                // Initial compact view (street view and status buttons)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column: Street view */}
                  <div className="space-y-4">
                    {/* Street View */}
                    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800">
                      <div className="relative aspect-video">
                        <img 
                          src={streetViewUrl} 
                          alt={`Street view of ${address}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Card>
                  </div>
                  
                  {/* Right column: Status Buttons */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <h3 className="text-lg font-semibold">Property Status</h3>
                      
                      {/* No Answer button */}
                      <button
                        onClick={() => onStatusChange("No Answer")}
                        onMouseOver={() => setHoveredButton("No Answer")}
                        onMouseOut={() => setHoveredButton(null)}
                        className={cn(
                          "py-3 rounded-lg text-white font-semibold transition-all",
                          currentStatus === "No Answer" ? "ring-2 ring-white" : "",
                          hoveredButton === "No Answer" ? "shadow-md -translate-y-0.5" : ""
                        )}
                        style={{
                          background: getButtonGradient("No Answer", statusColors["No Answer"])
                        }}
                      >
                        No Answer
                      </button>
                      
                      {/* Other status buttons */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {availableStatuses
                          .filter(status => status !== "No Answer")
                          .map((status) => {
                            const isActive = currentStatus === status;
                            const backgroundColor = statusColors[status] || "#6b7280";
                            
                            return (
                              <button
                                key={status}
                                onClick={() => onStatusChange(status)}
                                onMouseOver={() => setHoveredButton(status)}
                                onMouseOut={() => setHoveredButton(null)}
                                className={cn(
                                  "py-2 rounded-lg text-white font-semibold transition-all",
                                  isActive ? "ring-2 ring-white" : "",
                                  hoveredButton === status ? "shadow-md -translate-y-0.5" : ""
                                )}
                                style={{
                                  background: getButtonGradient(status, backgroundColor),
                                }}
                              >
                                {status}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                    
                    <div className="flex justify-center mt-6">
                      <Button 
                        onClick={toggleExpandedView} 
                        variant="outline" 
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Maximize2 className="h-4 w-4" />
                        Expand for more options
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Expanded view with accordion sections
                <div className="space-y-4">
                  {/* Contact Info Section */}
                  <Card className="border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div 
                      onClick={() => toggleSection("contact")} 
                      className={cn(
                        "flex justify-between items-center p-3 cursor-pointer",
                        expandedSection === "contact" ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Contact Information</span>
                      </div>
                      {expandedSection === "contact" ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                    
                    {expandedSection === "contact" && (
                      <CardContent className="p-4 pt-4">
                        {leadId ? (
                          <ContactForm 
                            leadId={leadId}
                            initialData={{
                              firstName: firstName || "",
                              lastName: lastName || "",
                              email: email || "",
                              phone: phone || "",
                              address: address || "",
                            }}
                            onSuccess={() => {
                              // Handle success
                            }}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground p-4 text-center">
                            Lead ID is required to update contact information
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                  
                  {/* Insurance Info Section */}
                  <Card className="border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div 
                      onClick={() => toggleSection("insurance")} 
                      className={cn(
                        "flex justify-between items-center p-3 cursor-pointer",
                        expandedSection === "insurance" ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Insurance Information</span>
                      </div>
                      {expandedSection === "insurance" ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                    
                    {expandedSection === "insurance" && (
                      <CardContent className="p-4 pt-4">
                        <InsuranceForm 
                          leadId={leadId || ""}
                          initialData={{
                            insuranceCompany: insuranceCompany || "",
                            insurancePolicyNumber: insurancePolicyNumber || "",
                            insurancePhone: insurancePhone || "",
                            insuranceDeductible: insuranceDeductible || "",
                            insuranceSecondaryPhone: insuranceSecondaryPhone || "",
                            dateOfLoss: dateOfLoss || "",
                            damageType: damageType as "HAIL" | "WIND" | "FIRE" | "" || "",
                            claimNumber: claimNumber || "",
                          }}
                          onSuccess={() => {
                            // Handle success
                          }}
                        />
                      </CardContent>
                    )}
                  </Card>
                  
                  {/* Adjuster Info Section */}
                  <Card className="border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div 
                      onClick={() => toggleSection("adjuster")} 
                      className={cn(
                        "flex justify-between items-center p-3 cursor-pointer",
                        expandedSection === "adjuster" ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Adjuster Information</span>
                      </div>
                      {expandedSection === "adjuster" ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                    
                    {expandedSection === "adjuster" && (
                      <CardContent className="p-4 pt-4">
                        <AdjusterForm 
                          leadId={leadId || ""}
                          initialData={{
                            insuranceAdjusterName: insuranceAdjusterName || "",
                            insuranceAdjusterPhone: insuranceAdjusterPhone || "",
                            insuranceAdjusterEmail: insuranceAdjusterEmail || "",
                            adjusterAppointmentDate: adjusterAppointmentDate ? new Date(adjusterAppointmentDate).toISOString().split('T')[0] : "",
                            adjusterAppointmentTime: adjusterAppointmentTime || "",
                            adjusterAppointmentNotes: adjusterAppointmentNotes || ""
                          }}
                          onSuccess={() => {
                            // Handle success
                          }}
                        />
                      </CardContent>
                    )}
                  </Card>
                  
                  {/* Notes Section */}
                  <Card className="border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div 
                      onClick={() => toggleSection("notes")} 
                      className={cn(
                        "flex justify-between items-center p-3 cursor-pointer",
                        expandedSection === "notes" ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Notes</span>
                      </div>
                      {expandedSection === "notes" ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                    
                    {expandedSection === "notes" && (
                      <CardContent className="p-4 pt-4">
                        {/* Add note form */}
                        <form
                          onSubmit={handleNoteSubmit(onSubmitNote)}
                          className="flex flex-col gap-3 mb-4"
                        >
                          <div className="flex flex-col gap-2">
                            <Label 
                              htmlFor="note-content" 
                              className="font-semibold"
                            >
                              Add Note
                            </Label>
                            <textarea
                              id="note-content"
                              placeholder="Enter your notes here..."
                              rows={3}
                              disabled={isSavingNote}
                              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...registerNote("content")}
                            />
                            {noteErrors.content && (
                              <p className="text-red-500 text-sm mt-1">
                                {noteErrors.content.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              type="submit"
                              disabled={isSavingNote}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isSavingNote ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  <span>Save Note</span>
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* Messages */}
                          {noteError && (
                            <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm mt-2">
                              {noteError}
                            </div>
                          )}
                          
                          {noteSuccess && (
                            <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm mt-2">
                              {noteSuccess}
                            </div>
                          )}
                        </form>
                        
                        {/* Note history */}
                        <div className="max-h-[200px] overflow-y-auto">
                          <h3 className="text-md font-semibold mb-2 border-b pb-1">Previous Notes</h3>
                          {noteHistory.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No notes yet
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {noteHistory.map(note => (
                                <div
                                  key={note.id}
                                  className="bg-muted/30 rounded-md p-3 border border-zinc-200 dark:border-zinc-800"
                                >
                                  <p className="text-sm whitespace-pre-wrap mb-1">
                                    {note.content}
                                  </p>
                                  <div className="text-xs text-muted-foreground text-right italic">
                                    {formatDate(note.date)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                  
                  {/* Contract Section */}
                  <Card className="border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div 
                      onClick={() => toggleSection("contract")} 
                      className={cn(
                        "flex justify-between items-center p-3 cursor-pointer",
                        expandedSection === "contract" ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Contract System</span>
                      </div>
                      {expandedSection === "contract" ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                    
                    {expandedSection === "contract" && (
                      <CardContent className="p-4 pt-4 flex flex-col items-center justify-center">
                        <p className="text-sm text-muted-foreground text-center mb-4">
                          Access the contract management system externally.
                        </p>
                        <Button asChild variant="default" className="bg-purple-600 hover:bg-purple-700 text-white">
                          <Link href="https://contracts.purlin.pro/" target="_blank" rel="noopener noreferrer">
                            Open Contract System
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                  
                  <div className="flex justify-center mt-6">
                    <Button 
                      onClick={toggleExpandedView} 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Minimize2 className="h-4 w-4" />
                      Collapse to status view
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 