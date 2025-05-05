"use client"

import { Home, UserPlus, Calendar, FolderOpen, MessageSquare, Calculator, Cloud, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { LeadsDrawer } from "@/components/leads-drawer"
import { AppointmentsDrawer } from "@/components/appointments/appointments-drawer"
import { FilesSheet } from "@/components/files/files-sheet"
import { SimpleCalculator } from "@/components/calculator/simple-calculator"
import type { LeadFile } from "@/types/documents"
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
        <div className="p-4">
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
  const [isFilesSheetOpen, setIsFilesSheetOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  useEffect(() => {
    if (isLeadsDrawerOpen || isAppointmentsDrawerOpen || isFilesSheetOpen || isCalculatorOpen) {
      setIsExpanded(false)
    }
  }, [isLeadsDrawerOpen, isAppointmentsDrawerOpen, isFilesSheetOpen, isCalculatorOpen])

  const navItems = [
    { icon: Home, label: "Dashboard", action: () => {} },
    { icon: UserPlus, label: "Leads", action: () => setIsLeadsDrawerOpen(true) },
    { icon: Calendar, label: "Appointments", action: () => userId && setIsAppointmentsDrawerOpen(true), disabled: !userId },
    { icon: FolderOpen, label: "Files", action: () => setIsFilesSheetOpen(true) },
  ]

  const mockFiles: LeadFile[] = []

  return (
    <>
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
      <FilesSheet
        isOpen={isFilesSheetOpen}
        onClose={() => setIsFilesSheetOpen(false)}
        files={mockFiles}
        leadId="current"
      />
      {isCalculatorOpen && <SimpleCalculator onClose={() => setIsCalculatorOpen(false)} />}
    </>
  )
}
