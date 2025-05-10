"use client"

import React, { useEffect, useState, useMemo } from "react"
import { ChevronDown, ChevronUp, MapPin, Loader2, Save, ExternalLink, Maximize2, Minimize2, UserPlus } from "lucide-react"
import { ContactForm } from "@/components/forms/ContactForm"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface SimpleMapCardModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
  initialLeadId?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export function SimpleMapCardModal({
  isOpen,
  onClose,
  address,
  initialLeadId,
  firstName,
  lastName,
  email,
  phone,
}: SimpleMapCardModalProps) {
  console.log("[SimpleMapCardModal] Rendering. initialLeadId:", initialLeadId);

  const [isMobile, setIsMobile] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | undefined>(initialLeadId);

  console.log("[SimpleMapCardModal] activeLeadId state after init:", activeLeadId);

  useEffect(() => {
    console.log("[SimpleMapCardModal] useEffect for initialLeadId change. New initialLeadId:", initialLeadId, "Current activeLeadId:", activeLeadId);
    setActiveLeadId(initialLeadId);
  }, [initialLeadId]);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) {
    console.log("[SimpleMapCardModal] Not open, returning null.");
    return null;
  }

  console.log("[SimpleMapCardModal] Is open. Current activeLeadId before form render:", activeLeadId);

  const contactInitialValues = useMemo(() => ({
    firstName: firstName || "",
    lastName: lastName || "",
    email: email || "",
    phone: phone || "",
    address: address || "",
  }), [firstName, lastName, email, phone, address]);

  const handleContactSaveSuccess = (savedLeadIdFromBackend: string) => {
    setActiveLeadId(savedLeadIdFromBackend);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "bg-white dark:bg-gray-900 shadow-xl rounded-lg p-0 overflow-hidden max-w-md w-full",
        )}
      >
        <DialogTitle className="sr-only">Property Details</DialogTitle>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col h-full"
        >
          <Card className="border-0 rounded-none shadow-none flex-grow flex flex-col">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {address || "Property Details"}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 overflow-y-auto flex-grow">
              <div>
                <h3 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-200 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
                  Contact Information
                </h3>
                {activeLeadId ? (
                  <ContactForm
                    initialData={contactInitialValues}
                    leadId={activeLeadId}
                    onSuccess={handleContactSaveSuccess}
                  />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    <p>Lead information is unavailable.</p>
                    <p>Please close and reopen the modal or ensure a lead is selected.</p>
                  </div>
                )}
              </div>

              {activeLeadId && (
                <div className="mt-6 pt-6 border-t dark:border-gray-700">
                  <Link href={`/leads/${activeLeadId}`} passHref>
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700"
                      onClick={onClose}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Lead Page
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex justify-end">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
          </Card>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 