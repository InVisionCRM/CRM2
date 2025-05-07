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

// Helper to extract the light theme background class
const getButtonBgClass = (statusClasses: string): string => {
  // Matches bg-color-shade, ensuring it's not preceded by dark:
  const lightBgMatch = statusClasses.match(/(?<!dark:)bg-([a-z]+)-(\d+)/);
  if (lightBgMatch) return `bg-${lightBgMatch[1]}-${lightBgMatch[2]}`;
  return 'bg-gray-100'; // Default fallback
};

// Helper to extract the light theme text class
const getButtonTextClass = (statusClasses: string): string => {
  // Matches text-color-shade, ensuring it's not preceded by dark:
  const lightTextMatch = statusClasses.match(/(?<!dark:)text-([a-z]+)-(\d+)/);
  if (lightTextMatch) return `text-${lightTextMatch[1]}-${lightTextMatch[2]}`;
  return 'text-gray-800'; // Default fallback
};

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
          const buttonBgClass = getButtonBgClass(fullColorString);
          const buttonTextClass = getButtonTextClass(fullColorString);
          
          // Ring color for active state - changed to static bright neon green
          const activeRingClasses = "ring-lime-500 dark:ring-lime-400";

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
                buttonBgClass, 
                buttonTextClass, 
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