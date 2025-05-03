"use client"

import React, { useEffect, useRef, useState, CSSProperties } from "react"
import { createPortal } from "react-dom"
import { PropertyVisitStatus } from "./MapInteractionDrawer"
import { ChevronDown, ChevronUp, User, FileText, Clipboard, MessageSquare, MapPin, Sliders, Loader2, Maximize2, Minimize2, X, Save } from "lucide-react"
import { ContactForm } from "@/components/forms/ContactForm"
import { InsuranceForm } from "@/components/forms/InsuranceForm"
import { AdjusterForm } from "@/components/forms/AdjusterForm"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

interface SimpleMapDrawerProps {
  isOpen: boolean
  onClose: () => void
  address: string
  streetViewUrl?: string
  availableStatuses?: PropertyVisitStatus[]
  currentStatus?: PropertyVisitStatus
  onStatusChange: (status: PropertyVisitStatus) => void
  onExpand: () => void
  isExpanded: boolean
  onCollapse: () => void
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

export function SimpleMapDrawer({
  isOpen,
  onClose,
  address,
  streetViewUrl = "https://via.placeholder.com/600x300/cccccc/969696?text=Street+View+Not+Available",
  availableStatuses = ["No Answer", "Not Interested", "Follow up", "Inspected", "In Contract"],
  currentStatus,
  onStatusChange,
  onExpand,
  isExpanded,
  onCollapse,
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
}: SimpleMapDrawerProps) {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  // Add state for button hover
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  // Add state for expanded accordion sections
  const [expandedSection, setExpandedSection] = useState<string | null>("streetview");
  // Add state for iframe loading
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  // Add state for fullscreen mode
  const [isContractFullscreen, setIsContractFullscreen] = useState(false);
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
  
  // Update expandedSection when expansion state changes
  useEffect(() => {
    if (isExpanded) {
      setExpandedSection("streetview");
    }
  }, [isExpanded]);
  
  // Add event listener for messages from contract iframe
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== "https://contracts.purlin.pro") return;
      
      // Handle contract system messages
      if (event.data && typeof event.data === "object") {
        if (event.data.type === "CONTRACT_SIGNED") {
          // Handle contract signed event
          console.log("Contract signed:", event.data);
          // Could update status or show notification
        } else if (event.data.type === "CONTRACT_ERROR") {
          // Handle error from contract system
          setIframeError(true);
        }
      }
    };
    
    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);
  
  // Create a portal element on mount and add viewport meta tag for mobile
  useEffect(() => {
    // Add viewport meta tag if it doesn't exist to ensure proper mobile scaling
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
      document.head.appendChild(meta);
    }
    
    // Create a new div element for the portal
    const el = document.createElement('div');
    el.id = 'map-drawer-portal';
    // Add styles that will isolate it from the rest of the page
    el.style.cssText = `
      position: fixed;
      z-index: 9999;
      bottom: 0;
      left: 0;
      right: 0;
      background: none !important;
    `;
    
    // Add it to the body
    document.body.appendChild(el);
    setPortalElement(el);
    
    // Add a global style for mobile optimization
    const style = document.createElement('style');
    style.innerHTML = `
      #map-drawer-portal * {
        color-scheme: dark !important;
      }
      .map-drawer {
        background-color: rgba(0, 0, 0, 0.7) !important;
        backdrop-filter: blur(5px) !important;
        -webkit-backdrop-filter: blur(5px) !important;
      }
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
      @media (max-width: 767px) {
        .map-drawer {
          font-size: 14px !important;
        }
        .map-drawer h2, .map-drawer h3 {
          font-size: 1.1rem !important;
        }
        .map-drawer button {
          font-size: 0.9rem !important;
        }
        .contact-form-container .form-label {
          font-size: 1.2rem !important;
        }
        .contact-form-container input {
          font-size: 1rem !important;
          height: 3rem !important;
        }
        .contact-form-container button {
          font-size: 1.1rem !important;
          height: 3rem !important;
        }
        .map-drawer textarea {
          font-size: 0.9rem !important;
        }
        /* Additional mobile-specific styles */
        .contact-form-container .form-label {
          margin-bottom: 0.3rem !important;
        }
        .contact-form-container .grid {
          gap: 0.75rem !important;
        }
        /* Improve mobile form readability */
        input, select, textarea {
          -webkit-appearance: none !important;
          border-radius: 8px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Clean up on unmount
    return () => {
      document.body.removeChild(el);
      document.head.removeChild(style);
    };
  }, []);
  
  // Add an animation keyframe style at the beginning of the component
  useEffect(() => {
    if (isOpen) {
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        @keyframes glowFadeRight {
          0% {
            background-position: 0% 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            background-position: 100% 0%;
            opacity: 0.7;
          }
        }
        
        @keyframes subtleExpand {
          0% {
            border-radius: 4px;
          }
          100% {
            border-radius: 12px 12px 4px 4px;
          }
        }
      `;
      document.head.appendChild(styleEl);
      
      return () => {
        document.head.removeChild(styleEl);
      };
    }
  }, [isOpen]);
  
  // Add useEffect for ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isContractFullscreen) {
        setIsContractFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContractFullscreen]);
  
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
  
  // Don't render anything if not open or portal element isn't ready
  if (!isOpen || !portalElement) {
    return null;
  }

  // Determine the drawer height based on expanded state - improve SSR handling
  const getViewportAdjustedValue = (expandedValue: string, mobileValue: string, desktopValue: string) => {
    // Server-side rendering check
    if (typeof window === 'undefined') {
      return desktopValue; // Default to desktop value during SSR
    }
    
    const isMobileViewport = window.innerWidth < 768;
    if (isExpanded) {
      return expandedValue;
    } else {
      return isMobileViewport ? mobileValue : desktopValue;
    }
  };

  // Use the helper function for drawer height
  const drawerHeight = getViewportAdjustedValue("90vh", "40vh", "25vh");

  // Use the helper function for bezel height  
  const bezelHeight = getViewportAdjustedValue("3.25rem", "2rem", "2.5rem");

  // Use the helper function for handle width
  const handleWidth = getViewportAdjustedValue("180px", "30px", "40px");

  // Toggle an accordion section
  const toggleSection = (section: string) => {
    // Reset iframe loading state when expanding contract section
    if (section === "contract" && expandedSection !== "contract") {
      setIframeLoading(true);
      setIframeError(false);
    }
    
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate available height for the accordion section
  const accordionHeight = isExpanded ? `calc(${drawerHeight} - ${bezelHeight})` : "0";

  // Create a function to get the header style with animation
  const getAccordionHeaderStyle = (section: string, expandedSection: string | null): CSSProperties => {
    const isExpanded = expandedSection === section;
    
    return {
      padding: "16px 20px",
      background: "linear-gradient(to right, rgba(255, 255, 255, 0.08), transparent)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
      position: "relative",
      borderRadius: isExpanded ? "12px 12px 4px 4px" : "4px",
      transition: "border-radius 0.4s ease-out, background 0.4s ease",
      animation: isExpanded ? "subtleExpand 0.4s ease forwards" : "none",
      borderBottom: isExpanded ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
      ...(isExpanded && {
        background: "linear-gradient(to right, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05))",
      }),
    };
  };
  
  // Create a function to get the animated bezel style
  const getAnimatedBezelStyle = (): CSSProperties => {
    return {
      position: "absolute",
      bottom: "0",
      left: "0",
      height: "3px",
      width: "100%",
      background: "linear-gradient(to right, #a3e635, rgba(163, 230, 53, 0.1))",
      animation: "glowFadeRight 1.5s ease forwards",
      boxShadow: "0 0 10px rgba(163, 230, 53, 0.7)",
    };
  };

  // Render the drawer in the portal
  return createPortal(
    <div className="map-drawer" style={{
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      backdropFilter: "blur(5px)",
      WebkitBackdropFilter: "blur(5px)",
      color: "white",
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
      overflow: "hidden",
      height: drawerHeight,
      transition: "height 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 -4px 15px -1px rgba(0, 0, 0, 0.4), 0 -2px 8px -1px rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderBottom: "none"
    }}>
      {/* Green gradient handle area */}
      <div 
        onClick={isExpanded ? onCollapse : onExpand}
        style={{
          background: "linear-gradient(to bottom, rgba(101, 163, 13, 0.95) 0%, rgba(0, 0, 0, 0.7) 100%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          height: bezelHeight,
          width: "100%",
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "height 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.15)"
        }}
      >
        <div style={{
          width: handleWidth,
          height: "6px",
          borderRadius: "3px",
          background: `linear-gradient(90deg, 
            rgba(163, 230, 53, 0.9) 0%, 
            #a3e635 20%, 
            #84cc16 40%, 
            #ecfccb 50%, 
            #84cc16 60%, 
            #a3e635 80%, 
            rgba(163, 230, 53, 0.9) 100%)`,
          backgroundSize: "200% 100%",
          transition: "width 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: "shimmer 3s infinite linear",
          boxShadow: "0 0 6px #a3e635"
        }}></div>
      </div>

      {/* Content area */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        height: `calc(${drawerHeight} - ${bezelHeight})`,
        position: "relative",
        overflow: "hidden",
        transition: "height 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
        backgroundColor: "rgba(0, 0, 0, 0.2)"
      }}>
        {/* Status buttons - visible only in non-expanded state */}
        {!isExpanded ? (
          // Non-expanded view with street view and buttons side by side
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            padding: "8px",
            height: "100%",
            transition: "height 0.7s cubic-bezier(0.16, 1, 0.3, 1), min-height 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative"
          }}>
            {/* Left: Street view */}
            <div style={{
              width: isMobile ? "100%" : "40%",
              marginRight: isMobile ? "0" : "8px",
              marginBottom: isMobile ? "8px" : "0",
              height: isMobile ? "30%" : "100%"
            }}>
              <div style={{
                height: "100%",
                position: "relative",
                borderRadius: "4px",
                overflow: "hidden",
                backgroundColor: "rgba(31, 41, 55, 0.7)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              }}>
                <img 
                  src={streetViewUrl} 
                  alt={`Street view of ${address}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  padding: "8px",
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.4) 50%, transparent)",
                  color: "white"
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: isMobile ? "12px" : "14px",
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>{address}</p>
                </div>
              </div>
            </div>

            {/* Right: Status buttons */}
            <div style={{
              width: isMobile ? "100%" : "60%",
              height: isMobile ? "70%" : "100%",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              backgroundColor: "transparent",
              padding: isMobile ? "0" : "0 0 0 8px"
            }}>
              {/* No Answer button at top */}
              <button
                onClick={() => onStatusChange("No Answer")}
                onMouseOver={() => setHoveredButton("No Answer")}
                onMouseOut={() => setHoveredButton(null)}
                style={{
                  background: `linear-gradient(145deg, ${statusColors["No Answer"]} 0%, #1e40af 100%)`,
                  border: currentStatus === "No Answer" ? "2px solid #ffffff" : "1px solid rgba(132, 204, 22, 0.7)",
                  color: "white",
                  fontSize: isMobile ? "18px" : "22px",
                  fontWeight: "bold",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  padding: isMobile ? "2px" : "4px",
                  margin: 0,
                  opacity: hoveredButton === "No Answer" ? 1 : 0.9,
                  flex: "1 1 0",
                  minHeight: isMobile ? "30%" : "40%",
                  boxShadow: hoveredButton === "No Answer" 
                    ? "0 6px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)" 
                    : "0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                  transform: hoveredButton === "No Answer" ? "translateY(-2px)" : "translateY(0)",
                  transition: "all 0.5s ease",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)"
                }}
              >
                No Answer
              </button>
              
              {/* Bottom row of 4 equal buttons */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "1fr",
                gap: "3px",
                flex: "1 1 0",
                minHeight: isMobile ? "60%" : "40%"
              }}>
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
                        style={{
                          background: getButtonGradient(status, backgroundColor),
                          border: isActive ? "2px solid #ffffff" : "1px solid rgba(132, 204, 22, 0.7)",
                          color: "white",
                          fontSize: isMobile ? "14px" : "18px",
                          fontWeight: "bold",
                          borderRadius: "12px",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          textAlign: "center",
                          padding: isMobile ? "2px" : "4px",
                          margin: 0,
                          opacity: hoveredButton === status ? 1 : 0.85,
                          width: "100%",
                          height: "100%",
                          boxShadow: hoveredButton === status 
                            ? "0 6px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)" 
                            : "0 4px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                          textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                          transform: hoveredButton === status ? "translateY(-2px)" : "translateY(0)",
                          transition: "all 0.5s ease",
                          backdropFilter: "blur(4px)",
                          WebkitBackdropFilter: "blur(4px)"
                        }}
                      >
                        {status}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Accordion sections */}
        {isExpanded && (
          <div style={{
            height: "100%",
            overflowY: "auto",
            padding: isMobile ? "8px" : "12px",
            opacity: isExpanded ? 1 : 0,
            transition: "opacity 0.7s ease-in, height 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? "6px" : "8px"
          }}>
            {/* StreetView Section */}
            <div style={{
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              overflow: "hidden",
              flex: expandedSection === "streetview" ? "1" : "none",
              transition: "flex 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(10, 10, 10, 0.2)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}>
              <div 
                onClick={() => toggleSection("streetview")} 
                style={{
                  ...getAccordionHeaderStyle("streetview", expandedSection),
                  padding: isMobile ? "12px 16px" : "16px 20px",
                }}
              >
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "12px",
                  width: "100%",
                  justifyContent: "center"
                }}>
                  <MapPin size={isMobile ? 20 : 28} className="text-lime-500" />
                  <span style={{ 
                    fontWeight: "bold", 
                    fontSize: isMobile ? "18px" : "24px", 
                    letterSpacing: "-0.02em",
                    textAlign: "center",
                    maxWidth: "90%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {address}
                  </span>
                </div>
                {expandedSection === "streetview" ? <ChevronUp size={isMobile ? 20 : 28} /> : <ChevronDown size={isMobile ? 20 : 28} />}
                {expandedSection === "streetview" && <div style={getAnimatedBezelStyle()} />}
              </div>
              {expandedSection === "streetview" && (
                <div style={{ 
                  padding: "0", 
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  height: "100%"
                }}>
                  <img 
                    src={streetViewUrl} 
                    alt={`Street view of ${address}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}
            </div>

            {/* Contact Info Section */}
            <div style={{
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              overflow: "hidden",
              flex: expandedSection === "contact" ? "1" : "none",
              transition: "flex 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(10, 10, 10, 0.2)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}>
              <div 
                onClick={() => toggleSection("contact")} 
                style={{
                  ...getAccordionHeaderStyle("contact", expandedSection),
                  padding: isMobile ? "12px 16px" : "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <User size={isMobile ? 20 : 28} />
                  <span style={{ 
                    fontWeight: "bold", 
                    fontSize: isMobile ? "16px" : "20px", 
                    letterSpacing: "-0.02em" 
                  }}>
                    Contact Information
                  </span>
                </div>
                {expandedSection === "contact" ? <ChevronUp size={isMobile ? 20 : 28} /> : <ChevronDown size={isMobile ? 20 : 28} />}
                {expandedSection === "contact" && <div style={getAnimatedBezelStyle()} />}
              </div>
              {expandedSection === "contact" && (
                <div style={{ 
                  padding: "16px", 
                  background: "rgba(255, 255, 255, 0.015)",
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto" 
                }}>
                  <style jsx global>{`
                    /* Larger text for contact form */
                    .contact-form-container .form-label {
                      font-size: 1.5rem !important;
                      font-weight: 700 !important;
                      letter-spacing: -0.02em !important;
                    }
                    
                    .contact-form-container input {
                      font-size: 1.25rem !important;
                      height: 4rem !important;
                      padding: 0 1.25rem !important;
                    }
                    
                    .contact-form-container input::placeholder {
                      font-size: 1.25rem !important;
                    }
                    
                    .contact-form-container button {
                      font-size: 1.5rem !important;
                      font-weight: 600 !important;
                      height: 4rem !important;
                    }
                    
                    .contact-form-container .text-xs {
                      font-size: 0.875rem !important;
                    }
                  `}</style>
                  <div className="contact-form-container">
                    <ContactForm 
                      leadId={leadId || ""}
                      initialData={{
                        firstName: firstName || "",
                        lastName: lastName || "",
                        email: email || "",
                        phone: phone || "",
                        streetAddress: streetAddress || address || "",
                        // Removed city, state, and zipcode fields
                      }}
                      onSuccess={() => {
                        // Handle success, e.g., show a notification or update lead info
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Insurance Info Section */}
            <div style={{
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              overflow: "hidden",
              flex: expandedSection === "insurance" ? "1" : "none",
              transition: "flex 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(10, 10, 10, 0.2)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}>
              <div 
                onClick={() => toggleSection("insurance")} 
                style={{
                  ...getAccordionHeaderStyle("insurance", expandedSection),
                  padding: isMobile ? "12px 16px" : "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileText size={isMobile ? 20 : 28} />
                  <span style={{ 
                    fontWeight: "bold", 
                    fontSize: isMobile ? "16px" : "20px", 
                    letterSpacing: "-0.02em" 
                  }}>
                    Insurance Information
                  </span>
                </div>
                {expandedSection === "insurance" ? <ChevronUp size={isMobile ? 20 : 28} /> : <ChevronDown size={isMobile ? 20 : 28} />}
                {expandedSection === "insurance" && <div style={getAnimatedBezelStyle()} />}
              </div>
              {expandedSection === "insurance" && (
                <div style={{ 
                  padding: "16px", 
                  background: "rgba(255, 255, 255, 0.015)",
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto"
                }}>
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
                      // Handle success, e.g., show a notification or update lead info
                    }}
                  />
                </div>
              )}
            </div>

            {/* Adjuster Info Section */}
            <div style={{
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              overflow: "hidden",
              flex: expandedSection === "adjuster" ? "1" : "none",
              transition: "flex 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(10, 10, 10, 0.2)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}>
              <div 
                onClick={() => toggleSection("adjuster")} 
                style={{
                  ...getAccordionHeaderStyle("adjuster", expandedSection),
                  padding: isMobile ? "12px 16px" : "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Sliders size={isMobile ? 20 : 28} />
                  <span style={{ 
                    fontWeight: "bold", 
                    fontSize: isMobile ? "16px" : "20px", 
                    letterSpacing: "-0.02em" 
                  }}>
                    Adjuster Information
                  </span>
                </div>
                {expandedSection === "adjuster" ? <ChevronUp size={isMobile ? 20 : 28} /> : <ChevronDown size={isMobile ? 20 : 28} />}
                {expandedSection === "adjuster" && <div style={getAnimatedBezelStyle()} />}
              </div>
              {expandedSection === "adjuster" && (
                <div style={{ 
                  padding: "16px", 
                  background: "rgba(255, 255, 255, 0.015)",
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto"
                }}>
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
                      // Handle success, e.g., show a notification or update lead info
                    }}
                  />
                </div>
              )}
            </div>

            {/* Contract Section */}
            <div style={{
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              overflow: "hidden",
              flex: expandedSection === "contract" ? "1" : "none",
              transition: "flex 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(10, 10, 10, 0.2)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}>
              <div 
                onClick={() => toggleSection("contract")} 
                style={{
                  ...getAccordionHeaderStyle("contract", expandedSection),
                  padding: isMobile ? "12px 16px" : "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Clipboard size={isMobile ? 20 : 28} />
                  <span style={{ 
                    fontWeight: "bold", 
                    fontSize: isMobile ? "16px" : "20px", 
                    letterSpacing: "-0.02em" 
                  }}>
                    Contract
                  </span>
                </div>
                {expandedSection === "contract" ? <ChevronUp size={isMobile ? 20 : 28} /> : <ChevronDown size={isMobile ? 20 : 28} />}
                {expandedSection === "contract" && <div style={getAnimatedBezelStyle()} />}
              </div>
              {expandedSection === "contract" && (
                <div style={{ 
                  padding: "0", 
                  background: "rgba(255, 255, 255, 0.015)",
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  height: "100%",
                  minHeight: "500px"
                }}>
                  {/* Fullscreen Toggle Button */}
                  {!isContractFullscreen && (
                    <button
                      onClick={() => setIsContractFullscreen(true)}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        zIndex: 10,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "none",
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                      }}
                      aria-label="Expand to fullscreen"
                    >
                      <Maximize2 size={20} color="white" />
                    </button>
                  )}

                  {iframeLoading && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0, 0, 0, 0.4)",
                      zIndex: 5,
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                    }}>
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        gap: "12px" 
                      }}>
                        <Loader2 size={40} className="animate-spin text-lime-500" />
                        <span style={{ 
                          color: "white", 
                          fontSize: "16px",
                          fontWeight: "500" 
                        }}>
                          Loading contracts...
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {iframeError && (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "32px",
                      textAlign: "center",
                      height: "100%"
                    }}>
                      <div style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        borderRadius: "8px",
                        padding: "24px",
                        maxWidth: "400px"
                      }}>
                        <h3 style={{ color: "white", fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
                          Unable to load contracts
                        </h3>
                        <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", marginBottom: "16px" }}>
                          There was a problem loading the contract system. Please try again later or contact support.
                        </p>
                        <button
                          onClick={() => {
                            setIframeLoading(true);
                            setIframeError(false);
                            // Force iframe reload by toggling and reopening the section
                            setExpandedSection(null);
                            setTimeout(() => setExpandedSection("contract"), 100);
                          }}
                          style={{
                            backgroundColor: "rgba(132, 204, 22, 0.8)",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "14px"
                          }}
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <iframe 
                    ref={contractIframeRef}
                    src="https://contracts.purlin.pro/" 
                    title="In-Vision Construction Contracts"
                    style={{
                      width: "100%",
                      height: "100%", 
                      border: "none",
                      borderRadius: "0 0 8px 8px",
                      backgroundColor: "#1e293b",
                      display: iframeError ? "none" : "block",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)"
                    }}
                    onLoad={() => setIframeLoading(false)}
                    onError={() => {
                      setIframeLoading(false);
                      setIframeError(true);
                    }}
                    allow="clipboard-write"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                </div>
              )}
            </div>

            {/* Fullscreen Contract Modal */}
            {isContractFullscreen && contractIframeRef.current && createPortal(
              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#1e293b",
                zIndex: 99999,
                display: "flex",
                flexDirection: "column"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
                }}>
                  <h2 style={{
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <Clipboard size={20} />
                    In-Vision Construction Contracts
                  </h2>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setIsContractFullscreen(false)}
                      style={{
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        border: "none",
                        borderRadius: "6px",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      aria-label="Exit fullscreen"
                    >
                      <Minimize2 size={20} color="white" />
                    </button>
                    <button
                      onClick={() => setIsContractFullscreen(false)}
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.8)",
                        border: "none",
                        borderRadius: "6px",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      aria-label="Close"
                    >
                      <X size={20} color="white" />
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  {iframeLoading && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0, 0, 0, 0.4)",
                      zIndex: 5
                    }}>
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        gap: "12px" 
                      }}>
                        <Loader2 size={40} className="animate-spin text-lime-500" />
                        <span style={{ color: "white", fontSize: "16px" }}>Loading contracts...</span>
                      </div>
                    </div>
                  )}
                  <iframe 
                    src="https://contracts.purlin.pro/" 
                    title="In-Vision Construction Contracts (Fullscreen)"
                    style={{
                      width: "100%",
                      height: "100%", 
                      border: "none",
                      backgroundColor: "#1e293b"
                    }}
                    onLoad={() => setIframeLoading(false)}
                    onError={() => {
                      setIframeLoading(false);
                      setIframeError(true);
                    }}
                    allow="clipboard-write"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  />
                </div>
              </div>,
              document.body
            )}

            {/* Notes Section */}
            <div style={{
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              overflow: "hidden",
              flex: expandedSection === "notes" ? "1" : "none",
              transition: "flex 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "rgba(10, 10, 10, 0.2)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}>
              <div 
                onClick={() => toggleSection("notes")} 
                style={{
                  ...getAccordionHeaderStyle("notes", expandedSection),
                  padding: isMobile ? "12px 16px" : "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <MessageSquare size={isMobile ? 20 : 28} />
                  <span style={{ 
                    fontWeight: "bold", 
                    fontSize: isMobile ? "16px" : "20px", 
                    letterSpacing: "-0.02em" 
                  }}>
                    Notes
                  </span>
                </div>
                {expandedSection === "notes" ? <ChevronUp size={isMobile ? 20 : 28} /> : <ChevronDown size={isMobile ? 20 : 28} />}
                {expandedSection === "notes" && <div style={getAnimatedBezelStyle()} />}
              </div>
              {expandedSection === "notes" && (
                <div style={{ 
                  padding: isMobile ? "12px" : "16px", 
                  background: "rgba(255, 255, 255, 0.015)",
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto"
                }}>
                  {/* Add note form */}
                  <form
                    onSubmit={handleNoteSubmit(onSubmitNote)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      marginBottom: "24px"
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Label 
                        htmlFor="note-content" 
                        className="form-label text-white text-opacity-90 text-xl font-bold"
                      >
                        Add Note
                      </Label>
                      <textarea
                        id="note-content"
                        placeholder="Enter your notes here..."
                        rows={isMobile ? 3 : 5}
                        disabled={isSavingNote}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "12px",
                          fontSize: isMobile ? "14px" : "16px",
                          resize: "vertical",
                          width: "100%",
                        }}
                        {...registerNote("content")}
                      />
                      {noteErrors.content && (
                        <p style={{ color: "#ef4444", fontSize: "14px", margin: "4px 0 0" }}>
                          {noteErrors.content.message}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button 
                        type="submit"
                        disabled={isSavingNote}
                        style={{
                          backgroundColor: "rgba(132, 204, 22, 0.8)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 16px",
                          fontSize: "16px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: isSavingNote ? "not-allowed" : "pointer",
                          opacity: isSavingNote ? 0.7 : 1,
                        }}
                      >
                        {isSavingNote ? (
                          <>
                            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            <span>Save Note</span>
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Messages */}
                    {noteError && (
                      <div style={{
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        padding: "10px",
                        borderRadius: "6px",
                        color: "#fecaca",
                        fontSize: "14px",
                        marginTop: "8px"
                      }}>
                        {noteError}
                      </div>
                    )}
                    
                    {noteSuccess && (
                      <div style={{
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        padding: "10px",
                        borderRadius: "6px",
                        color: "#bbf7d0",
                        fontSize: "14px",
                        marginTop: "8px"
                      }}>
                        {noteSuccess}
                      </div>
                    )}
                  </form>
                  
                  {/* Note history */}
                  <div style={{ marginTop: "16px" }}>
                    <h3 style={{
                      color: "white",
                      fontSize: "18px",
                      fontWeight: "bold",
                      marginBottom: "12px",
                      borderBottom: "1px solid rgba(132, 204, 22, 0.3)",
                      paddingBottom: "8px"
                    }}>
                      Previous Notes
                    </h3>
                    
                    {noteHistory.length === 0 ? (
                      <p style={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "15px",
                        textAlign: "center",
                        padding: "20px 0"
                      }}>
                        No notes yet
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {noteHistory.map(note => (
                          <div
                            key={note.id}
                            style={{
                              backgroundColor: "rgba(30, 41, 59, 0.4)",
                              borderRadius: "8px",
                              padding: "12px",
                              border: "1px solid rgba(148, 163, 184, 0.1)"
                            }}
                          >
                            <p style={{
                              color: "white",
                              fontSize: "15px",
                              whiteSpace: "pre-wrap",
                              marginBottom: "8px"
                            }}>
                              {note.content}
                            </p>
                            <div style={{
                              color: "rgba(255, 255, 255, 0.5)",
                              fontSize: "13px",
                              textAlign: "right",
                              fontStyle: "italic"
                            }}>
                              {formatDate(note.date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    portalElement
  );
} 