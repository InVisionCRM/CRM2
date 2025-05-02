"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { getSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import type { Visit } from "@/types/note"
import { StreetViewImage } from "./street-view-image"
import type { SessionUser } from "@/lib/auth-utils"

interface QuickStatusCardProps {
  address: string
  position: [number, number]
  status?: string
  onStatusChange: (status: string) => void
  onExpand: () => void
  className?: string
  markerId?: string
  onClose: () => void
}

const statusOptions = [
  { value: "No Answer", label: "No Answer", color: "bg-blue-500 hover:bg-blue-600", icon: "❓" },
  { value: "Not Interested", label: "Not Interested", color: "bg-red-500 hover:bg-red-600", icon: "✖️" },
  { value: "Inspected", label: "Inspected", color: "bg-green-500 hover:bg-green-600", icon: "✅" },
  { value: "Follow-up", label: "Follow-up", color: "bg-amber-500 hover:bg-amber-600", icon: "📅" },
  { value: "In Contract", label: "In Contract", color: "bg-indigo-500 hover:bg-indigo-600", icon: "📝" },
]

const QuickStatusCard = ({ 
  address, 
  position, 
  status,
  onStatusChange,
  onExpand,
  className,
  markerId,
  onClose
}: QuickStatusCardProps) => {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [previousVisits, setPreviousVisits] = useState<Visit[]>([])

  // Fetch existing visits when component mounts
  useEffect(() => {
    const fetchExistingVisits = async () => {
      try {
        // Skip API call completely for temporary markers
        if (markerId && !markerId.startsWith('temp-')) {
          const response = await fetch(`/api/vision-markers/${markerId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.visits && Array.isArray(data.visits)) {
              setPreviousVisits(data.visits)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching existing visits:", error)
      }
    }

    fetchExistingVisits()
  }, [markerId])

  const saveVisit = async (newStatus: string) => {
    try {
      setIsSaving(true)
      const session = await getSession()
      const user = session?.user as SessionUser | undefined
      const userName = user?.name || "Unknown"
      const userEmail = user?.email || "unknown@example.com"
      const userId = user?.id || null

      const newVisit = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        salesPersonId: userEmail,
        status: newStatus,
        notes: "",
      }

      // Always create a new marker for temporary IDs
      const isTemp = !markerId || markerId.startsWith('temp-')
      const allVisits = isTemp ? [newVisit] : [newVisit, ...previousVisits]

      const visitData = {
        lat: position[0],
        lng: position[1],
        address: address,
        notes: "",
        status: newStatus,
        contactInfo: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
        },
        salesPersonId: userEmail,
        user_id: userId,
        visits: allVisits,
      }

      // Always create a new marker for temporary IDs
      const url = isTemp ? "/api/vision-markers" : `/api/vision-markers/${markerId}`
      const method = isTemp ? "POST" : "PUT"

      console.log(`Making ${method} request to ${url} with data:`, visitData)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response data:", errorData)
        throw new Error(`Failed to save visit: ${response.status}`)
      }

      const responseData = await response.json()
      console.log("Save visit successful response:", responseData)

      // Also update the visits table
      await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          lat: position[0],
          lng: position[1],
          status: newStatus,
          notes: "",
          salesPersonId: userEmail,
          user_id: userId,
        }),
      })

      // Emit the status update event
      const event = new CustomEvent('markerStatusUpdate', {
        detail: { 
          address: address,
          status: newStatus,
          markerId: responseData.id // Include the new marker ID if this was a POST
        }
      })
      window.dispatchEvent(event)

      toast({
        title: "Success",
        description: "Status updated successfully",
      })

      return true
    } catch (error) {
      console.error("Error saving visit:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusClick = async (newStatus: string) => {
    try {
      onStatusChange(newStatus)
      const saved = await saveVisit(newStatus)
      if (saved) {
        setTimeout(() => {
          onClose()
        }, 100)
      }
    } catch (error) {
      console.error("Error in handleStatusClick:", error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 w-[400px] bg-white rounded-lg shadow-lg overflow-hidden z-50",
        className
      )}
    >
      <div className="relative h-[200px] group">
        <StreetViewImage
          position={position}
          address={address}
          status={status}
          onStatusChange={onStatusChange}
          className="w-full h-full"
          showStatus={true}
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-200 z-10"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-900 truncate">{address}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="h-8 px-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {statusOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStatusClick(option.value)}
              disabled={isSaving}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200",
                "text-white font-medium text-xs",
                option.color,
                status === option.value && "ring-2 ring-offset-2 ring-gray-900 shadow-lg",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-lg mb-1">{option.icon}</span>
              <span className="text-[10px]">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default QuickStatusCard 