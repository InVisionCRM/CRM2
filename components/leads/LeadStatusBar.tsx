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

// Helper function for glow properties (similar to StatusGrid)
const getStatusButtonGlowStyle = (status: LeadStatus): React.CSSProperties => {
  let glowColor = "rgba(107, 114, 128, 0.6)"; // Default glow (grayish, if no status matches)

  // Using the base color logic from getStatusColor in lib/utils.ts
  // This mapping needs to be maintained or derived more directly if possible
  switch (status) {
    case LeadStatus.signed_contract:
      glowColor = "rgba(59, 130, 246, 0.7)"; // Blue-500
      break;
    case LeadStatus.scheduled:
    case LeadStatus.colors: // Assuming colors and scheduled share a similar base (purple in utils)
      glowColor = "rgba(139, 92, 246, 0.7)"; // Purple-500 
      break;
    case LeadStatus.acv:
      glowColor = "rgba(234, 179, 8, 0.7)"; // Yellow-500
      break;
    case LeadStatus.job:
      glowColor = "rgba(99, 102, 241, 0.7)"; // Indigo-500
      break;
    case LeadStatus.completed_jobs:
      glowColor = "rgba(34, 197, 94, 0.7)"; // Green-500
      break;
    case LeadStatus.zero_balance:
      glowColor = "rgba(107, 114, 128, 0.7)"; // Gray-500 (from utils)
      break;
    case LeadStatus.denied:
      glowColor = "rgba(239, 68, 68, 0.7)"; // Red-500
      break;
    case LeadStatus.follow_ups:
      glowColor = "rgba(249, 115, 22, 0.7)"; // Orange-800 from utils is dark, using a lighter orange for glow
      break;
    default:
      // Fallback if a status is somehow not covered, though LeadStatus enum should be exhaustive
      glowColor = "rgba(107, 114, 128, 0.6)"; 
      break;
  }
  return {
    boxShadow: `inset 0 0 15px 5px ${glowColor}`, // Adjusted spread and blur for buttons
  };
};

// Helper to extract the light theme text class
const getButtonTextClass = (statusClasses: string): string => {
  const lightTextMatch = statusClasses.match(/(?<!dark:)text-([a-z]+)-(\d+)/);
  if (lightTextMatch) return `text-${lightTextMatch[1]}-${lightTextMatch[2]}`;
  // Fallback for text color if not found, e.g. for follow_ups which is 'text-black' in light mode
  if (statusClasses.includes('text-black')) return 'text-black';
  return 'text-gray-800'; 
};

// Helper to extract the dark theme text class
const getButtonDarkTextClass = (statusClasses: string): string => {
    const darkTextMatch = statusClasses.match(/dark:text-([a-z]+)-(\d+)/);
    if (darkTextMatch) return `dark:text-${darkTextMatch[1]}-${darkTextMatch[2]}`;
    // Fallback for dark text color, e.g. for follow_ups 'dark:text-orange-100'
    if (statusClasses.includes('dark:text-orange-100')) return 'dark:text-orange-100'; // Specific for follow_ups
    if (statusClasses.includes('dark:text-black')) return 'dark:text-black'; // If any status uses dark:text-black
    return 'dark:text-gray-100';
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
    <div className="bg-transparent border-none rounded-lg p-3 sm:p-4 shadow-none"> {/* Made container transparent, removed border/shadow */}
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
          const buttonTextClass = getButtonTextClass(fullColorString);
          const buttonDarkTextClass = getButtonDarkTextClass(fullColorString);
          
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
                "btn relative flex items-center justify-center rounded-md transition-all", // Added .btn class, removed border-2
                "min-h-[48px] min-w-[calc(20%-8px)] xs:min-w-[calc(20%-8px)] sm:min-w-[4.5rem] flex-grow xs:flex-grow-0", 
                "p-1 text-center shadow-md", // Kept shadow-md for a little depth if desired, or remove
                buttonTextClass, 
                buttonDarkTextClass,
                isActive ? "border-[3px] border-[#59FF00] scale-105 shadow-lg" : "hover:opacity-90", // Updated active state border
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
                isLoading ? "cursor-not-allowed opacity-70" : "", // Style for loading state
                isButtonLoading ? "opacity-50" : "" // Slightly more dim for the specific loading button
              )}
              style={getStatusButtonGlowStyle(statusKey)} // Apply dynamic glow style
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