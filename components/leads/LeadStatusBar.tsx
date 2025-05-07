import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { LeadStatus } from "@prisma/client"
import { formatStatusLabel, getStatusColor } from "@/lib/utils"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"; // Import loader icon

interface LeadStatusBarProps {
  currentStatus: LeadStatus
  onStatusChange: (status: LeadStatus) => void
  isLoading?: boolean; // Added isLoading prop
  loadingStatus?: LeadStatus | null; // Track which status change is loading
  // Consider adding isLoading prop if status changes involve async operations
  // isLoading?: boolean 
}

// Updated statusConfig to primarily store a base color hint if needed by getStatusColor
// Or, if getStatusColor directly returns full Tailwind classes, this might not be strictly necessary here.
// For this example, I'm assuming getStatusColor returns a string like "bg-blue-500 text-white"

export function LeadStatusBar({ currentStatus, onStatusChange, isLoading, loadingStatus }: LeadStatusBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (containerRef.current) {
      const activeButton = containerRef.current.querySelector(`[data-status="${currentStatus}"]`) as HTMLElement | null
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'auto', // Changed to auto for less jarring scroll on status change
          block: 'nearest',
          inline: 'nearest'
        })
      }
    }
  }, [currentStatus])

  // Helper to extract the most relevant "solid" background color class
  const getSolidBgClass = (statusClasses: string): string => {
    const darkBgMatch = statusClasses.match(/dark:bg-([a-z]+)-(\d+)/);
    if (darkBgMatch) return darkBgMatch[0]; // Prefer dark mode solid bg if present
    const lightBgMatch = statusClasses.match(/bg-([a-z]+)-(\d+)/);
    if (lightBgMatch && parseInt(lightBgMatch[2]) >= 500) return lightBgMatch[0]; // Prefer 500+ shades for light mode
    if (lightBgMatch) return lightBgMatch[0]; // Fallback to any light bg
    return 'bg-gray-500'; // Default fallback
  }
  
  // Helper to determine text color based on assumed background (simplified)
  // This assumes dark backgrounds will typically have light text defined in getStatusColor or defaults to white
  const getSolidTextColorClass = (statusClasses: string): string => {
    const darkTextMatch = statusClasses.match(/dark:text-([a-z]+)-(\d+)/);
    if (darkTextMatch) return darkTextMatch[0];
    const lightTextMatch = statusClasses.match(/text-([a-z]+)-(\d+)/);
    // If the light text is dark (e.g. text-blue-800), we might want white text for a solid bg
    // This heuristic might need adjustment based on your actual color palette from getStatusColor
    if (lightTextMatch && parseInt(lightTextMatch[2]) > 500) return 'text-white';
    if (lightTextMatch) return lightTextMatch[0]; 
    return 'text-white'; // Default to white for solid backgrounds
  }

  return (
    <div className="bg-background border border-border rounded-lg p-3 sm:p-4 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Lead Status:</h2>
      <div 
        ref={containerRef}
        // flex-wrap allows items to wrap. justify-start will keep items aligned to the start.
        // On smaller screens, items will take up defined width and wrap naturally.
        // The centering of the last row is implicit if the container width allows.
        className="flex flex-wrap gap-2 pb-1 justify-start hide-scrollbar"
      >
        {Object.values(LeadStatus).map((statusValue) => {
          const statusKey = statusValue as LeadStatus;
          const isActive = currentStatus === statusKey;
          
          const fullColorString = getStatusColor(statusKey);
          const solidBg = getSolidBgClass(fullColorString);
          // For full color buttons, text is usually white or black based on contrast with solidBg
          // The getStatusColor provides text-xxx-100 for dark BGs and text-xxx-800 for light BGs
          // We should aim for high contrast, typically white text on a dark solid background.
          let solidTextColor = 'text-white'; // Default for dark solid backgrounds
          // If your getStatusColor provides specific contrasting text for its solid version, parse it.
          // Example: if getStatusColor had "bg-blue-500 text-white", we'd use text-white.
          // This part is tricky without knowing the exact output of getStatusColor for *solid* variants.
          // We can make a simple assumption: if the solidBg is a dark shade (e.g., 500+), use white text.
          const bgColorShadeMatch = solidBg.match(/bg-[a-z]+-(\d+)/);
          if (bgColorShadeMatch && parseInt(bgColorShadeMatch[2]) < 500) {
             // If the solid background is a light shade (unlikely given getSolidBgClass logic but as a fallback)
             solidTextColor = 'text-black dark:text-white'; // or a dark gray
          }
          // Override with dark mode text color if available and suitable for a solid dark bg
          const darkTextMatch = fullColorString.match(/dark:text-([a-z]+)-(\d+)/);
          if (darkTextMatch && parseInt(darkTextMatch[2]) < 300) { // e.g. dark:text-blue-100
            solidTextColor = darkTextMatch[0];
          } 
          // Ring color for active state (based on the primary hue of the button)
          let ringBase = 'primary'; // default ring
          const ringColorMatch = solidBg.match(/bg-([a-z]+)-/); //e.g. bg-blue-
          if (ringColorMatch && ringColorMatch[1]) {
            ringBase = ringColorMatch[1]; // e.g. blue
          }
          const activeRingClasses = `ring-${ringBase}-500 dark:ring-${ringBase}-400`;

          const isButtonLoading = isLoading && loadingStatus === statusKey;

          return (
            <button
              key={statusKey}
              data-status={statusKey}
              onClick={() => {
                if (!isLoading) { // Prevent action if already loading
                  onStatusChange(statusKey)
                }
              }}
              disabled={isLoading} // Disable all buttons if any status change is loading
              className={cn(
                "relative flex items-center justify-center rounded-md border-2 transition-all",
                "min-h-[48px] min-w-[calc(20%-8px)] xs:min-w-[calc(20%-8px)] sm:min-w-[4.5rem] flex-grow xs:flex-grow-0", 
                "p-1 text-center", 
                solidBg, 
                solidTextColor, 
                isActive ? `ring-2 ring-offset-2 ring-offset-background ${activeRingClasses} scale-105 shadow-lg` : `border-transparent hover:opacity-90 shadow-md`,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
                isLoading ? "cursor-not-allowed opacity-70" : "", // Style for loading state
                isButtonLoading ? "opacity-50" : "" // Slightly more dim for the specific loading button
              )}
              title={formatStatusLabel(statusKey)}
            >
              {isButtonLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className={cn(
                  "font-semibold leading-tight break-words",
                  "text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs" // Further reduced font sizes
                )}>
                  {formatStatusLabel(statusKey)}
                </span>
              )}
              
              {isActive && !isButtonLoading && ( // Hide indicator if button is loading
                <motion.div 
                  className="absolute -bottom-0.5 left-1/4 right-1/4 h-1 bg-current rounded-t-sm" // Indicator at bottom center
                  layoutId="activeStatusSolidIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
} 