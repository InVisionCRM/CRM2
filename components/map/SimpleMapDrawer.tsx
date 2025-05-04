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
  
  // Add timeout for iframe loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (expandedSection === "contract" && iframeLoading) {
      // Set a 15-second timeout for iframe loading
      timeoutId = setTimeout(() => {
        console.error("Contract iframe loading timeout");
        setIframeLoading(false);
        setIframeError(true);
      }, 15000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [expandedSection, iframeLoading]);

  // Handle iframe loading state changes
  const handleIframeLoad = () => {
    console.log("Contract iframe loaded successfully");
    setIframeLoading(false);
    setIframeError(false);
  };

  const handleIframeError = (error: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error("Contract iframe loading error:", error);
    setIframeLoading(false);
    setIframeError(true);
  };
  
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

  // Add these utility functions at the top of the file with other functions
  const getAccordionHeaderBaseClasses = (isExpanded: boolean) => `
    flex justify-between items-center
    bg-gradient-to-r from-white/8 to-transparent
    cursor-pointer relative
    ${isExpanded ? 'rounded-t-xl rounded-b' : 'rounded'}
    transition-[border-radius,background] duration-400 ease-out
    border-b border-white/10
  `;

  const getAnimatedBezelClasses = () => `
    absolute bottom-0 left-0 h-[3px] w-full
    bg-gradient-to-r from-lime-400 to-lime-400/10
    animate-[glowFadeRight_1.5s_ease_forwards]
    shadow-[0_0_10px_rgba(163,230,53,0.7)]
  `;

  // Render the drawer in the portal
  return createPortal(
    <div 
      className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md text-white rounded-t-lg overflow-hidden shadow-lg border border-white/10 border-b-0 transition-[height] duration-700 ease-[cubic\-bezier(0\.16\,1\,0\.3\,1)]"
      style={{
        height: drawerHeight,
      }}
    >
      {/* Green gradient bezel/handle area */}
      <div 
        className="flex justify-between items-center cursor-pointer relative px-4 border-b border-white/15 transition-[height] duration-700 ease-[cubic\-bezier(0\.16\,1\,0\.3\,1)] bg-gradient-to-b from-lime-700/95 to-black/70 backdrop-blur-sm"
        style={{
          height: bezelHeight,
        }}
      >
        <div className="w-6"></div> {/* Empty spacer for alignment */}
        
        <div 
          onClick={isExpanded ? onCollapse : onExpand}
          className="h-1.5 rounded-full shadow-lg shadow-lime-500 bg-gradient-to-r from-lime-500/90 via-lime-300 to-lime-500/90 bg-[length:200%_100%] animate-shimmer transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: handleWidth,
          }}
        ></div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`bg-black/30 border border-white/20 rounded-full flex items-center justify-center cursor-pointer p-0 transition-all duration-200 shadow-md ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}
          aria-label="Close drawer"
        >
          <X 
            size={isMobile ? 14 : 16} 
            className="opacity-80 stroke-[2.5]"
          />
        </button>
      </div>

      {/* Content area */}
      <div 
        className="flex flex-col relative overflow-hidden transition-[height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-black/20"
        style={{
          height: `calc(${drawerHeight} - ${bezelHeight})`,
        }}
      >
        {/* Status buttons - visible only in non-expanded state */}
        {!isExpanded ? (
          // Non-expanded view with street view and buttons side by side
          <div className={`
            flex ${isMobile ? 'flex-col' : 'flex-row'} p-2 h-full relative
            transition-[height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          `}>
            {/* Left: Street view */}
            <div className={`
              ${isMobile ? 'w-full h-[30%] mb-2' : 'w-[40%] h-full mr-2'}
            `}>
              <div className="h-full relative rounded overflow-hidden bg-gray-800/70 shadow-md">
                <img 
                  src={streetViewUrl} 
                  alt={`Street view of ${address}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                  <p className={`
                    m-0 font-bold overflow-hidden text-ellipsis whitespace-nowrap
                    ${isMobile ? 'text-xs' : 'text-sm'}
                  `}>
                    {address}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Status buttons */}
            <div className={`
              ${isMobile ? 'w-full h-[70%]' : 'w-[60%] h-full'} 
              flex flex-col gap-[3px] bg-transparent
              ${isMobile ? '' : 'pl-2'}
            `}>
              {/* No Answer button at top */}
              <button
                onClick={() => onStatusChange("No Answer")}
                onMouseOver={() => setHoveredButton("No Answer")}
                onMouseOut={() => setHoveredButton(null)}
                className={`
                  bg-gradient-to-br from-blue-500 to-blue-800
                  ${currentStatus === "No Answer" ? 'border-2 border-white' : 'border border-lime-500/70'}
                  text-white font-bold rounded-xl cursor-pointer
                  flex justify-center items-center text-center
                  ${isMobile ? 'text-lg p-0.5' : 'text-2xl p-1'}
                  ${hoveredButton === "No Answer" ? 'opacity-100 translate-y-[-2px]' : 'opacity-90'}
                  flex-1 ${isMobile ? 'min-h-[30%]' : 'min-h-[40%]'}
                  ${hoveredButton === "No Answer" 
                    ? 'shadow-lg shadow-black/40' 
                    : 'shadow-md shadow-black/30'}
                  transition-all duration-500 backdrop-blur-sm
                `}
              >
                No Answer
              </button>
              
              {/* Bottom row of 4 equal buttons */}
              <div className="grid grid-cols-4 gap-[3px] flex-1 min-h-[40%]">
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
                        className={`
                          ${isActive ? 'border-2 border-white' : 'border border-lime-500/70'}
                          text-white font-bold rounded-xl cursor-pointer
                          flex justify-center items-center text-center
                          ${isMobile ? 'text-sm p-0.5' : 'text-lg p-1'}
                          ${hoveredButton === status ? 'opacity-100 translate-y-[-2px]' : 'opacity-85'}
                          w-full h-full
                          ${hoveredButton === status 
                            ? 'shadow-lg shadow-black/30' 
                            : 'shadow-md shadow-black/20'}
                          transition-all duration-500 backdrop-blur-sm
                        `}
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
          </div>
        ) : null}

        {/* Accordion sections */}
        {isExpanded && (
          <div className={`
            h-full overflow-y-auto ${isMobile ? 'p-2' : 'p-3'}
            opacity-100 transition-[opacity,height] duration-700 ease-in
            flex flex-col gap-2
          `}>
            {/* StreetView Section */}
            <div className={`
              border border-white/15 rounded-lg overflow-hidden
              ${expandedSection === "streetview" ? 'flex-1' : 'flex-none'}
              transition-[flex] duration-700 ease-[cubic\-bezier(0\.16\,1\,0\.3\,1)]
              flex flex-col bg-black/20 backdrop-blur-md shadow-md
            `}>
              <div 
                onClick={() => toggleSection("streetview")} 
                className={`
                  ${getAccordionHeaderBaseClasses(expandedSection === "streetview")}
                  ${isMobile ? 'py-3 px-4' : 'py-4 px-5'}
                `}
              >
                <div className="flex items-center gap-3 w-full justify-center">
                  <MapPin size={isMobile ? 20 : 28} className="text-lime-500" />
                  <span className={`
                    font-bold tracking-tight text-center max-w-[90%] 
                    overflow-hidden text-ellipsis whitespace-nowrap
                    ${isMobile ? 'text-lg' : 'text-2xl'}
                  `}>
                    {address}
                  </span>
                </div>
                {expandedSection === "streetview" ? (
                  <ChevronUp size={isMobile ? 20 : 28} />
                ) : (
                  <ChevronDown size={isMobile ? 20 : 28} />
                )}
                {expandedSection === "streetview" && (
                  <div className={getAnimatedBezelClasses()} />
                )}
              </div>
              {expandedSection === "streetview" && (
                <div className="p-0 flex-1 flex flex-col relative h-full">
                  <img 
                    src={streetViewUrl} 
                    alt={`Street view of ${address}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Contact Info Section */}
            <div className={`
              border border-white/15 rounded-lg overflow-hidden
              ${expandedSection === "contact" ? 'flex-1' : 'flex-none'}
              transition-[flex] duration-700 ease-[cubic\-bezier(0\.16\,1\,0\.3\,1)]
              flex flex-col bg-black/20 backdrop-blur-md shadow-md
            `}>
              <div 
                onClick={() => toggleSection("contact")} 
                className={`
                  ${getAccordionHeaderBaseClasses(expandedSection === "contact")}
                  ${isMobile ? 'py-3 px-4' : 'py-4 px-5'}
                `}
              >
                <div className="flex items-center gap-3 w-full justify-center">
                  <User size={isMobile ? 20 : 28} />
                  <span className={`
                    font-bold tracking-tight text-center max-w-[90%] 
                    overflow-hidden text-ellipsis whitespace-nowrap
                    ${isMobile ? 'text-lg' : 'text-2xl'}
                  `}>
                    Contact Information
                  </span>
                </div>
                {expandedSection === "contact" ? (
                  <ChevronUp size={isMobile ? 20 : 28} />
                ) : (
                  <ChevronDown size={isMobile ? 20 : 28} />
                )}
                {expandedSection === "contact" && (
                  <div className={getAnimatedBezelClasses()} />
                )}
              </div>
              {expandedSection === "contact" && (
                <div className="p-0 flex-1 flex flex-col relative h-full">
                  <div className="contact-form-container">
                    {leadId ? (
                      <ContactForm 
                        leadId={leadId}
                        initialData={{
                          firstName: firstName || "",
                          lastName: lastName || "",
                          email: email || "",
                          phone: phone || "",
                          streetAddress: streetAddress || address || "",
                          city: city || "",
                          state: state || "",
                          zipcode: zipcode || ""
                        }}
                        onSuccess={() => {
                          // Handle success, e.g., show a notification or update lead info
                        }}
                      />
                    ) : (
                      <div className="text-white text-opacity-70 text-sm p-4 text-center">
                        Lead ID is required to update contact information
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Insurance Info Section */}
            <div className={`
              border border-white/15 rounded-lg overflow-hidden
              ${expandedSection === "insurance" ? 'flex-1' : 'flex-none'}
              transition-[flex] duration-700 ease-[cubic\-bezier(0\.16\,1\,0\.3\,1)]
              flex flex-col bg-black/20 backdrop-blur-md shadow-md
            `}>
              <div 
                onClick={() => toggleSection("insurance")} 
                className={`
                  ${getAccordionHeaderBaseClasses(expandedSection === "insurance")}
                  ${isMobile ? 'py-3 px-4' : 'py-4 px-5'}
                `}
              >
                <div className="flex items-center gap-3 w-full justify-center">
                  <FileText size={isMobile ? 20 : 28} />
                  <span className={`
                    font-bold tracking-tight text-center max-w-[90%] 
                    overflow-hidden text-ellipsis whitespace-nowrap
                    ${isMobile ? 'text-lg' : 'text-2xl'}
                  `}>
                    Insurance Information
                  </span>
                </div>
                {expandedSection === "insurance" ? (
                  <ChevronUp size={isMobile ? 20 : 28} />
                ) : (
                  <ChevronDown size={isMobile ? 20 : 28} />
                )}
                {expandedSection === "insurance" && (
                  <div className={getAnimatedBezelClasses()} />
                )}
              </div>
              {expandedSection === "insurance" && (
                <div className="p-0 flex-1 flex flex-col relative h-full">
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
            <div className={`
              border border-white/15 rounded-lg overflow-hidden
              ${expandedSection === "adjuster" ? 'flex-1' : 'flex-none'}
              transition-[flex] duration-700 ease-[cubic\-bezier(0\.16\,1\,0\.3\,1)]
              flex flex-col bg-black/20 backdrop-blur-md shadow-md
            `}>
              <div 
                onClick={() => toggleSection("adjuster")} 
                className={`
                  ${getAccordionHeaderBaseClasses(expandedSection === "adjuster")}
                  ${isMobile ? 'py-3 px-4' : 'py-4 px-5'}
                `}
              >
                <div className="flex items-center gap-3 w-full justify-center">
                  <Sliders size={isMobile ? 20 : 28} />
                  <span className={`
                    font-bold tracking-tight text-center max-w-[90%] 
                    overflow-hidden text-ellipsis whitespace-nowrap
                    ${isMobile ? 'text-lg' : 'text-2xl'}
                  `}>
                    Adjuster Information
                  </span>
                </div>
                {expandedSection === "adjuster" ? (
                  <ChevronUp size={isMobile ? 20 : 28} />
                ) : (
                  <ChevronDown size={isMobile ? 20 : 28} />
                )}
                {expandedSection === "adjuster" && (
                  <div className={getAnimatedBezelClasses()} />
                )}
              </div>
              {expandedSection === "adjuster" && (
                <div className="p-0 flex-1 flex flex-col relative h-full">
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
            <div className={`
              border border-white/15 rounded-lg overflow-hidden
              ${expandedSection === "contract" ? 'flex-1' : 'flex-none'}
              transition-[flex] duration-700 ease-[cubic\-bezier(0\.16\,1\,0\.3\,1)]
              flex flex-col bg-black/20 backdrop-blur-md shadow-md
            `}>
              <div 
                onClick={() => toggleSection("contract")} 
                className={`
                  ${getAccordionHeaderBaseClasses(expandedSection === "contract")}
                  ${isMobile ? 'py-3 px-4' : 'py-4 px-5'}
                `}
              >
                <div className="flex items-center gap-3 w-full justify-center">
                  <Clipboard size={isMobile ? 20 : 28} />
                  <span className={`
                    font-bold tracking-tight text-center max-w-[90%] 
                    overflow-hidden text-ellipsis whitespace-nowrap
                    ${isMobile ? 'text-lg' : 'text-2xl'}
                  `}>
                    Contract
                  </span>
                </div>
                {expandedSection === "contract" ? (
                  <ChevronUp size={isMobile ? 20 : 28} />
                ) : (
                  <ChevronDown size={isMobile ? 20 : 28} />
                )}
                {expandedSection === "contract" && (
                  <div className={getAnimatedBezelClasses()} />
                )}
              </div>
              {expandedSection === "contract" && (
                <div className="p-0 flex-1 flex flex-col relative h-full">
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

                  {/* Add note form */}
                  <form
                    onSubmit={handleNoteSubmit(onSubmitNote)}
                    className="flex flex-col gap-3 mb-6"
                  >
                    <div className="flex flex-col gap-2">
                      <Label 
                        htmlFor="note-content" 
                        className="text-white/90 text-xl font-bold"
                      >
                        Add Note
                      </Label>
                      <textarea
                        id="note-content"
                        placeholder="Enter your notes here..."
                        rows={isMobile ? 3 : 5}
                        disabled={isSavingNote}
                        className={`
                          bg-white/10 text-white rounded-lg p-3
                          ${isMobile ? 'text-sm' : 'text-base'}
                          resize-vertical w-full
                          placeholder:text-white/50
                          focus:outline-none focus:ring-2 focus:ring-lime-500/50
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        {...registerNote("content")}
                      />
                      {noteErrors.content && (
                        <p className="text-red-400 text-sm mt-1">
                          {noteErrors.content.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={isSavingNote}
                        className={`
                          bg-lime-500/80 text-white
                          flex items-center gap-2 px-4 py-2.5 text-base
                          rounded-lg border-none
                          ${isSavingNote ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer opacity-100'}
                          transition-all duration-200
                          hover:bg-lime-500/90 hover:shadow-lg
                        `}
                      >
                        {isSavingNote ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
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
                      <div className="bg-red-500/10 p-2.5 rounded-md text-red-200 text-sm mt-2">
                        {noteError}
                      </div>
                    )}
                    
                    {noteSuccess && (
                      <div className="bg-green-500/10 p-2.5 rounded-md text-green-200 text-sm mt-2">
                        {noteSuccess}
                      </div>
                    )}
                  </form>
                  
                  {/* Note history */}
                  <div className="mt-4">
                    <h3 className="text-white text-lg font-bold mb-3 border-b border-lime-500/30 pb-2">
                      Previous Notes
                    </h3>
                    
                    {noteHistory.length === 0 ? (
                      <p className="text-white/50 text-sm text-center py-5">
                        No notes yet
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {noteHistory.map(note => (
                          <div
                            key={note.id}
                            className="bg-slate-900/40 rounded-lg p-3 border border-slate-400/10"
                          >
                            <p className="text-white text-sm whitespace-pre-wrap mb-2">
                              {note.content}
                            </p>
                            <div className="text-white/50 text-xs text-right italic">
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

            {/* Fullscreen Contract Modal */}
            {isContractFullscreen && contractIframeRef.current && createPortal(
              <div className="fixed inset-0 bg-slate-900 z-[99999] flex flex-col">
                <div className="flex justify-between items-center px-4 py-3 bg-black/60 border-b border-white/10">
                  <h2 className="text-white text-lg font-bold m-0 flex items-center gap-2">
                    <Clipboard size={20} />
                    In-Vision Construction Contracts
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsContractFullscreen(false)}
                      className="bg-slate-900/80 border-none rounded-md w-10 h-10
                        flex items-center justify-center cursor-pointer
                        transition-all duration-200 hover:bg-slate-800/80"
                      aria-label="Exit fullscreen"
                    >
                      <Minimize2 size={20} className="text-white" />
                    </button>
                    <button
                      onClick={() => setIsContractFullscreen(false)}
                      className="bg-red-500/80 border-none rounded-md w-10 h-10
                        flex items-center justify-center cursor-pointer
                        transition-all duration-200 hover:bg-red-600/80"
                      aria-label="Close"
                    >
                      <X size={20} className="text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative">
                  {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-5">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={40} className="animate-spin text-lime-500" />
                        <span className="text-white text-base font-medium">
                          Loading contracts...
                        </span>
                      </div>
                    </div>
                  )}
                  <iframe 
                    ref={contractIframeRef}
                    src="https://contracts.purlin.pro/" 
                    title="In-Vision Construction Contracts (Fullscreen)"
                    className="w-full h-full border-none bg-slate-900"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    allow="clipboard-write"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
                  />
                </div>
              </div>,
              document.body
            )}

            {/* Loading Overlay */}
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-5">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={40} className="animate-spin text-lime-500" />
                  <span className="text-white text-base font-medium">
                    Loading contracts...
                  </span>
                </div>
              </div>
            )}

            {/* Error State */}
            {iframeError && (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="bg-red-500/10 rounded-lg p-6 max-w-md">
                  <h3 className="text-white text-lg font-bold mb-3">
                    Unable to load contracts
                  </h3>
                  <p className="text-white/80 text-sm mb-4">
                    There was a problem loading the contract system. Please try again later or contact support.
                  </p>
                  <button
                    onClick={() => {
                      setIframeLoading(true);
                      setIframeError(false);
                      setExpandedSection(null);
                      setTimeout(() => setExpandedSection("contract"), 100);
                    }}
                    className="bg-lime-500/80 text-white px-4 py-2 rounded
                      border-none cursor-pointer font-bold text-sm
                      hover:bg-lime-500/90 transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    portalElement
  );
} 