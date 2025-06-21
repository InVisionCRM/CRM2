/* app/components/QuickActions.tsx */
"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

/* ---------- QUICK ACTION CARD ---------- */

interface QuickActionProps {
  label: string
  value: string
  imageUrl?: string
  isLarge?: boolean
  className?: string
}

function QuickAction({ label, value, imageUrl, isLarge = false, className }: QuickActionProps) {
  const router = useRouter()

  const handleClick = () => {
    switch (value) {
      case "calendar":
        router.push("/calendar")
        break
      case "gmail":
        router.push("/gmail")
        break
      case "drive":
        router.push("/drive")
        break
      case "ai-assistant":
        // AI assistant functionality can be added here
        break
      case "leads":
        router.push("/leads")
        break
      case "map":
        router.push("/map")
        break
      case "mysigner":
        router.push("/submissions")
        break
      case "route-planner":
        router.push("/route-planner")
        break
      case "contracts":
        window.open("https://contracts.purlin.pro", "_blank")
        break
      default:
        break
    }
  }

  const isGoogleApp = ["gmail", "calendar", "drive"].includes(value)
  const isAI = value === "ai-assistant"

  // Base classes for all cards
  const baseClasses = cn(
    "relative w-full h-full rounded-xl overflow-hidden cursor-pointer",
    "transition-all duration-300 hover:brightness-110 hover:scale-[1.02]",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-primary/50",
    isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
    className
  )

  // Border and background styling
  let borderStyle = "border-2 border-gray-400 bg-gradient-to-br from-black/85 to-black/70"
  
  if (isGoogleApp) {
    const googleBorders = {
      gmail: "border-2 border-transparent bg-gradient-to-r from-[#EA4335]/30 via-[#FBBC04]/30 to-[#34A853]/30 before:absolute before:inset-0 before:p-[2px] before:rounded-xl before:bg-gradient-to-r before:from-[#EA4335] before:via-[#FBBC04] before:to-[#34A853] before:content-[''] after:absolute after:inset-[2px] after:rounded-lg after:bg-black/90 after:content-['']",
      calendar: "border-2 border-transparent bg-gradient-to-r from-[#4285F4]/30 via-[#EA4335]/30 to-[#34A853]/30 before:absolute before:inset-0 before:p-[2px] before:rounded-xl before:bg-gradient-to-r before:from-[#4285F4] before:via-[#EA4335] before:to-[#34A853] before:content-[''] after:absolute after:inset-[2px] after:rounded-lg after:bg-black/90 after:content-['']",
      drive: "border-2 border-transparent bg-gradient-to-r from-[#34A853]/30 via-[#4285F4]/30 to-[#FBBC04]/30 before:absolute before:inset-0 before:p-[2px] before:rounded-xl before:bg-gradient-to-r before:from-[#34A853] before:via-[#4285F4] before:to-[#FBBC04] before:content-[''] after:absolute after:inset-[2px] after:rounded-lg after:bg-black/90 after:content-['']"
    }
    borderStyle = googleBorders[value as keyof typeof googleBorders]
  } else if (isAI) {
    borderStyle = "border-none before:absolute before:inset-0 before:p-[2px] before:rounded-xl before:bg-gradient-to-r before:from-blue-500 before:via-purple-500 before:to-pink-500 before:content-[''] before:animate-pulse after:absolute after:inset-[2px] after:rounded-lg after:bg-black/90 after:content-['']"
  }

  return (
    <button onClick={handleClick} className={cn(baseClasses, borderStyle)}>
      {/* Background Image for non-Google/AI cards */}
      {imageUrl && !isGoogleApp && !isAI && (
        <div
          className="absolute inset-0 bg-center bg-cover opacity-90 before:absolute before:inset-0 before:bg-black/30 before:content-['']"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-2">
        {/* Google Apps Icons */}
        {isGoogleApp && imageUrl && (
          <img
            src={imageUrl}
            alt={label}
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md opacity-100 relative z-20"
          />
        )}

        {/* AI Assistant Icon */}
        {isAI && (
          <img
            src="/icons/gemini-color.svg"
            alt="Gemini AI"
            className="w-10 h-10 sm:w-14 sm:h-14 animate-pulse drop-shadow-md opacity-100 relative z-20"
          />
        )}

        {/* Text Labels for non-Google/AI cards */}
        {!isGoogleApp && !isAI && (
          <span className={cn(
            "mt-2 font-medium text-white text-center drop-shadow-md relative z-20",
            isLarge ? "text-xl sm:text-3xl" : "text-sm sm:text-lg",
            "px-3 py-1 rounded-lg bg-black/20 backdrop-blur-sm"
          )}>
            {label}
          </span>
        )}
      </div>
    </button>
  )
}

/* ---------- QUICK ACTIONS WRAPPER ---------- */

export function QuickActions() {
  return (
    <div className="w-full mx-auto p-2 sm:p-4">
      <div className="grid grid-cols-4 auto-rows-[80px] sm:auto-rows-[120px] gap-2 sm:gap-4 max-w-7xl mx-auto">
        {/* Row 1: Top 4 cards */}
        <QuickAction label="Calendar" value="calendar" imageUrl="/icons/calendar.svg" />
        <QuickAction label="Gmail" value="gmail" imageUrl="/icons/gmail-logo.png" />
        <QuickAction label="Drive" value="drive" imageUrl="/icons/drive.png" />
        <QuickAction label="AI Assistant" value="ai-assistant" />

        {/* Row 2: Middle 4 cards */}
        <QuickAction
          label="Map"
          value="map"
          imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Screenshot%202025-04-21%20at%2011.20.34%E2%80%AFAM-AtE0adjEctfQKxvUQsj3mL2NZtkzAt.png"
        />
        <QuickAction
          label="MySigner"
          value="mysigner"
          imageUrl="/images/dashboard/mysigner-stats.png"
        />
        <QuickAction
          label="Route Planner"
          value="route-planner"
          imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Screenshot%202025-04-21%20at%2011.20.34%E2%80%AFAM-AtE0adjEctfQKxvUQsj3mL2NZtkzAt.png"
        />
        <QuickAction
          label="Contracts"
          value="contracts"
          imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/dashboard-images/contracts.png"
        />

        {/* Row 3: Large Leads card spanning full width */}
        <QuickAction
          label="Leads"
          value="leads"
          imageUrl="https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Quick%20Actions/All_Leads-SEk2NEYpt4fARvrhTSLgiBsCi68m7Y.png"
          className="col-span-4 row-span-1"
        />
      </div>
    </div>
  )
}
