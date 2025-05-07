"use client"

import { Home, UserPlus, Calendar, FolderOpen, MessageSquare, Calculator, Cloud, MessageCircle, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { LeadsDrawer } from "@/components/leads-drawer"
import { AppointmentsDrawer } from "@/components/appointments/appointments-drawer"
import { LeadSelectionSheet } from "@/components/files/lead-selection-sheet"
import { SimpleCalculator } from "@/components/calculator/simple-calculator"
import { useSession } from "next-auth/react"

function ExpandedMenu({
  isOpen,
  onClose,
  setIsCalculatorOpen,
}: {
  isOpen: boolean
  onClose: () => void
  setIsCalculatorOpen: (open: boolean) => void
}) {
  if (!isOpen) return null

  const menuItems = [
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Email/Text Templates",
      action: () => console.log("Templates clicked"),
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      label: "Calculator",
      action: () => setIsCalculatorOpen(true),
    },
    {
      icon: <Cloud className="h-5 w-5" />,
      label: "Weather",
      action: () => console.log("Weather clicked"),
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: "Leave Feedback",
      action: () => console.log("Feedback clicked"),
    },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl shadow-lg z-50 pb-safe">
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        <div className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action()
                  onClose()
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-colors",
                  "text-gray-600 hover:text-primary hover:bg-gray-100",
                  "dark:text-gray-300 dark:hover:text-primary dark:hover:bg-gray-700",
                  "border border-gray-200 dark:border-gray-700",
                )}
              >
                <div className="p-2 rounded-full bg-primary/10 text-primary">{item.icon}</div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export function MobileNavigation() {
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [isExpanded, setIsExpanded] = useState(false)
  const [isLeadsDrawerOpen, setIsLeadsDrawerOpen] = useState(false)
  const [isAppointmentsDrawerOpen, setIsAppointmentsDrawerOpen] = useState(false)
  const [isLeadSelectionSheetOpen, setIsLeadSelectionSheetOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  useEffect(() => {
    if (isLeadsDrawerOpen || isAppointmentsDrawerOpen || isLeadSelectionSheetOpen || isCalculatorOpen) {
      setIsExpanded(false)
    }
  }, [isLeadsDrawerOpen, isAppointmentsDrawerOpen, isLeadSelectionSheetOpen, isCalculatorOpen])

  const navItems = [
    { icon: Home, label: "Dashboard", action: () => {} },
    { icon: UserPlus, label: "Leads", action: () => setIsLeadsDrawerOpen(true) },
    { icon: Calendar, label: "Appointments", action: () => userId && setIsAppointmentsDrawerOpen(true), disabled: !userId },
    { icon: FolderOpen, label: "Files", action: () => setIsLeadSelectionSheetOpen(true) },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-t-lg z-50 pb-safe">
        <div className="max-w-md mx-auto px-2">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item, index) => (
              <button
                key={item.label}
                onClick={item.action}
                disabled={item.disabled}
                className={cn(
                  "flex flex-col items-center justify-center w-1/4 h-full transition-colors duration-150 ease-in-out",
                  "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                  (item.label === "Leads" && isLeadsDrawerOpen) ||
                  (item.label === "Appointments" && isAppointmentsDrawerOpen) ||
                  (item.label === "Files" && isLeadSelectionSheetOpen)
                    ? "text-primary dark:text-primary"
                    : "",
                )}
                aria-label={item.label}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex flex-col items-center justify-center w-1/4 h-full transition-colors duration-150 ease-in-out",
                "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary focus:outline-none",
                isExpanded && "text-primary dark:text-primary"
              )}
              aria-label={isExpanded ? "Close more options" : "Open more options"}
            >
              {isExpanded ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
              <span className="text-xs mt-1">{isExpanded ? "Close" : "More"}</span>
            </button>
          </div>
        </div>
      </nav>

      <ExpandedMenu
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        setIsCalculatorOpen={setIsCalculatorOpen}
      />
      <LeadsDrawer isOpen={isLeadsDrawerOpen} onClose={() => setIsLeadsDrawerOpen(false)} />
      {userId && (
        <AppointmentsDrawer 
          isOpen={isAppointmentsDrawerOpen} 
          onClose={() => setIsAppointmentsDrawerOpen(false)} 
          userId={userId}
        />
      )}
      <LeadSelectionSheet 
        isOpen={isLeadSelectionSheetOpen} 
        onClose={() => setIsLeadSelectionSheetOpen(false)} 
        onLeadSelect={(lead) => {
          setIsLeadSelectionSheetOpen(false);
        }}
      />
      {isCalculatorOpen && <SimpleCalculator onClose={() => setIsCalculatorOpen(false)} />}
    </>
  )
}
