"use client"

import React, { useEffect, useState, useMemo } from "react"
import { ChevronDown, ChevronUp, MapPin, Loader2, Save, ExternalLink, Maximize2, Minimize2, UserPlus, Clock } from "lucide-react"
import { ContactForm } from "@/components/forms/ContactForm"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import VisitHistory from "./visit-history"
import type { Visit } from "./visit-history"
import type { PropertyVisitStatus } from "./types"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface SimpleMapCardModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  initialLeadId?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  streetViewUrl?: string
  status?: PropertyVisitStatus | "New" | "Search"
  onStatusChange?: (status: PropertyVisitStatus) => void
  position: [number, number]
}

const statusOptions = [
  { 
    value: "Follow-up", 
    label: "Follow-up", 
    color: "#f59e0b" // amber-500
  },
  { 
    value: "In Contract", 
    label: "In Contract", 
    color: "#a855f7" // purple-500
  },
  { 
    value: "Inspected", 
    label: "Inspected", 
    color: "#22c55e" // green-500
  },
  { 
    value: "No Answer", 
    label: "No Answer", 
    color: "#3b82f6" // blue-500
  },
  { 
    value: "Not Interested", 
    label: "Not Interested", 
    color: "#ef4444" // red-500
  }
]

export function SimpleMapCardModal({
  isOpen,
  onClose,
  address,
  initialLeadId,
  firstName,
  lastName,
  email,
  phone,
  streetViewUrl,
  status,
  onStatusChange,
  position,
}: SimpleMapCardModalProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [visits, setVisits] = useState<Visit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Fetch visit history when the modal opens
  useEffect(() => {
    const fetchVisits = async () => {
      if (!initialLeadId || initialLeadId.startsWith('temp-')) return
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/vision-markers/${initialLeadId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.visits && Array.isArray(data.visits)) {
            setVisits(data.visits)
          }
        }
      } catch (error) {
        console.error("Error fetching visits:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchVisits()
    }
  }, [isOpen, initialLeadId])

  const contactInitialValues = useMemo(() => ({
    firstName: firstName || "",
    lastName: lastName || "",
    email: email || "",
    phone: phone || "",
    address: address || "",
  }), [firstName, lastName, email, phone, address])

  const handleFormSuccess = (leadId: string, isNewLead: boolean) => {
    if (isNewLead) {
      setCreatedLeadId(leadId)
      toast({
        title: "Success!",
        description: "Lead has been created successfully.",
        duration: 5000,
      })
      setShowSuccessDialog(true)
    }
    setIsExpanded(false)
  }

  const handleViewLead = () => {
    if (createdLeadId) {
      router.push(`/leads/${createdLeadId}`)
    }
    onClose()
    setShowSuccessDialog(false)
  }

  const handleStayOnMap = () => {
    setShowSuccessDialog(false)
  }

  if (!isOpen) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 overflow-hidden max-w-md w-full bg-white dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full"
          >
            {/* Street View Section */}
            <div className="relative w-full h-[300px]">
              <img
                src={streetViewUrl}
                alt={`Street view of ${address}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-white" />
                    <p className="text-white text-sm font-medium">{address}</p>
                  </div>
                  {/* Status Buttons */}
                  <div className="flex justify-between items-center gap-2 w-full">
                    {statusOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        size="sm"
                        onClick={() => onStatusChange?.(option.value as PropertyVisitStatus)}
                        style={{
                          backgroundColor: option.color,
                          borderColor: option.color,
                          flex: 1
                        }}
                        className={cn(
                          "text-[11px] py-1 h-[50px] w-[50px] text-white hover:opacity-90 transition-all duration-200",
                          status === option.value && "ring-2 ring-white ring-offset-1 ring-offset-[color:var(--background)] scale-105"
                        )}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Visit History Section - Only show if there are visits */}
            {visits.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-semibold">Visit History</h3>
                </div>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <VisitHistory visits={visits} />
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {createdLeadId ? (
                <Link href={`/leads/${createdLeadId}`} passHref>
                  <Button
                    variant="default"
                    className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-black"
                  >
                    <ExternalLink className="w-4 h-4 text-black" />
                    View Lead Page
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="default"
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2 text-black"
                >
                  <UserPlus className="w-4 h-4 text-black" />
                  Enter Lead Info
                </Button>
              )}
            </div>

            {/* Expanded Contact Form Modal */}
            {isExpanded && (
              <Dialog open={isExpanded} onOpenChange={() => setIsExpanded(false)}>
                <DialogContent className="sm:max-w-md">
                  <DialogTitle>Contact Information</DialogTitle>
                  <div className="space-y-4">
                    {initialLeadId ? (
                      <ContactForm
                        initialData={contactInitialValues}
                        leadId={initialLeadId}
                        onSuccess={handleFormSuccess}
                      />
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        <p>Lead information is unavailable.</p>
                        <p>Please close and reopen the modal or ensure a lead is selected.</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>🎉 Congratulations!</DialogTitle>
          <DialogDescription>
            The lead has been successfully created. Would you like to view the lead's details now?
          </DialogDescription>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleStayOnMap}>
              Stay on Map
            </Button>
            <Button 
              onClick={handleViewLead}
              className="bg-lime-600 hover:bg-lime-700 text-black"
            >
              View Lead Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}