"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { getSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { InsuranceInfoCard } from "@/components/leads/insurance-info-card"
import { FollowUpScheduler } from "@/components/map/follow-up-scheduler"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import {
  CalendarDays,
  FileText,
  ClipboardCheck,
  Shield,
  ChevronDown,
  ChevronUp,
  Clock,
  UserCircle,
  Save,
  PlusCircle,
} from "lucide-react"
import GeneralContract from "@/components/general-contract"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import VisitHistory from "@/components/map/visit-history"
import type { Visit } from "@/types/note"
import type { MarkerData } from "@/components/map/mapbox-map"
import { StreetViewImage } from "@/components/map/street-view-image"
import QuickStatusCard from "@/components/map/quick-status-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
}

interface InsuranceInfo {
  company: string
  policyNumber: string
  phone: string
  secondaryPhone?: string | null
  adjusterName: string
  adjusterPhone: string
  adjusterEmail: string
  deductible: string
}

interface VisitInfo {
  status: string
  notes: string
  followUpDate: Date | null
  followUpTime: string | null
  followUpNotes: string | null
  salesPersonId: string
  date: string
}

interface CrmLeadCardModalProps {
  isOpen: boolean
  onClose: () => void
  address?: string
  position?: [number, number]
  markerId?: string
  markerData?: MarkerData
}

// Helper: Format a raw visit object into the Visit type
const formatVisit = (raw: any): Visit => {
  return {
    id: raw.id || `visit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    status: raw.status,
    notes: raw.notes,
    // Some sources use "timestamp", others "date"
    timestamp: raw.timestamp || raw.date,
    // Some use camelCase while others use snake_case
    salesPersonId: raw.salesPersonId || raw.salesperson_id,
  }
}

// Helper: Create a new visit object using one standardized pattern.
const getNewVisit = (visitInfo: VisitInfo, userEmail: string, userName: string): Visit => {
  const now = new Date().toISOString()
  return {
    id: `visit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: now,
    salesPersonId: userEmail,
    status: visitInfo.status,
    notes: visitInfo.notes,
  }
}

export default function CrmLeadCardModal({
  isOpen,
  onClose,
  address = "",
  position = [0, 0],
  markerId,
  markerData,
}: CrmLeadCardModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("visit")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [visitSaved, setVisitSaved] = useState(false)
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null)
  const [previousVisits, setPreviousVisits] = useState<Visit[]>([])
  const [isVisitsOpen, setIsVisitsOpen] = useState(false)
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)
  const [isSavingContract, setIsSavingContract] = useState(false)
  const [contractSaved, setContractSaved] = useState(false)
  const [contractData, setContractData] = useState<any>(null)
  const savingRef = useRef(false)
  const contractRef = useRef<any>(null)
  const [isCreatingLead, setIsCreatingLead] = useState(false)
  const [emailUsername, setEmailUsername] = useState("")
  const [emailDomain, setEmailDomain] = useState("")
  const [salesPeople, setSalesPeople] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log("CRM Modal - isOpen:", isOpen)
    console.log("CRM Modal - address:", address)
    console.log("CRM Modal - position:", position)
    console.log("CRM Modal - markerId:", markerId)
    console.log("CRM Modal - markerData:", markerData)
  }, [isOpen, address, position, markerId, markerData])

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: address || "",
  })

  const [visitInfo, setVisitInfo] = useState<VisitInfo>({
    status: "No Answer",
    notes: "",
    followUpDate: null,
    followUpTime: null,
    followUpNotes: null,
    salesPersonId: "",
    date: "",
  })

  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo | null>(null)

  const [adjusterAppointmentDate, setAdjusterAppointmentDate] = useState<Date | null>(null)
  const [adjusterAppointmentTime, setAdjusterAppointmentTime] = useState<string | null>(null)
  const [adjusterAppointmentNotes, setAdjusterAppointmentNotes] = useState<string | null>(null)
  const [adjusterModalOpen, setAdjusterModalOpen] = useState(false)

  // Effect to update email when username or domain changes
  useEffect(() => {
    if (emailUsername || emailDomain) {
      const newEmail = emailUsername + (emailDomain ? emailDomain : "")
      setContactInfo((prev) => ({ ...prev, email: newEmail }))
    }
  }, [emailUsername, emailDomain])

  // Effect to parse existing email into username and domain parts when loaded
  useEffect(() => {
    if (contactInfo.email && !emailUsername && !emailDomain) {
      const parts = contactInfo.email.split("@")
      if (parts.length === 2) {
        setEmailUsername(parts[0])
        setEmailDomain(`@${parts[1]}`)
      } else {
        setEmailUsername(contactInfo.email)
      }
    }
  }, [contactInfo.email])

  const handleEmailUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailUsername(e.target.value)
    setHasChanges(true)
  }

  const handleEmailDomainSelect = (domain: string) => {
    setEmailDomain(domain)
    setHasChanges(true)
  }

  const handleCreateLead = () => {
    setIsCreatingLead(true)
    // Simulate API call
    setTimeout(() => {
      setIsCreatingLead(false)
      toast({
        title: "Success",
        description: "Lead created successfully",
      })
      onClose()
    }, 1500)
  }

  // --- Helper function to fetch marker data ---
  const fetchMarkerData = async (id: string, updateVisits = true) => {
    try {
      const response = await fetch(`/api/vision-markers/${id}`)
      if (response.ok) {
        const marker = await response.json()
        if (updateVisits && marker.visits && Array.isArray(marker.visits)) {
          const formatted = marker.visits.map(formatVisit)
          setPreviousVisits(formatted)
        }
        if (marker.contact_info) {
          setContactInfo({
            firstName: marker.contact_info.firstName || "",
            lastName: marker.contact_info.lastName || "",
            email: marker.contact_info.email || "",
            phone: marker.contact_info.phone || "",
            address: marker.address || address,
          })
        }
        return marker
      } else {
        console.error("Failed to fetch marker:", response.status)
      }
    } catch (error) {
      console.error("Error fetching marker data:", error)
    }
    return null
  }

  // --- Helper: Search markers by address and update visits/contact info if found ---
  const searchMarkersByAddress = async () => {
    try {
      const encodedAddress = encodeURIComponent(address)
      const response = await fetch(`/api/vision-markers/search?address=${encodedAddress}`)
      if (response.ok) {
        const markers = await response.json()
        if (markers.length > 0) {
          const allVisits = markers.flatMap((marker: any) => marker.visits || [])
          const formatted = allVisits
            .map(formatVisit)
            .sort((a: Visit, b: Visit) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          setPreviousVisits(formatted)
          // Use the most recent marker's contact info
          const mostRecent = markers.sort(
            (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )[0]
          if (mostRecent.contact_info) {
            setContactInfo({
              firstName: mostRecent.contact_info.firstName || "",
              lastName: mostRecent.contact_info.lastName || "",
              email: mostRecent.contact_info.email || "",
              phone: mostRecent.contact_info.phone || "",
              address: mostRecent.address || address,
            })
          }
        } else {
          console.log("No markers found for address:", address)
        }
      } else {
        console.error("Failed to search markers by address:", response.status)
      }
    } catch (error) {
      console.error("Error searching markers by address:", error)
    }
  }

  // --- Helper: Fetch official visits from the visits API (with fallbacks) ---
  const fetchOfficialVisits = async () => {
    const encodedAddress = encodeURIComponent(address)
    const visitsResponse = await fetch(`/api/visits?address=${encodedAddress}`)
    if (visitsResponse.ok) {
      const visitsData = await visitsResponse.json()
      if (Array.isArray(visitsData) && visitsData.length > 0) {
        return visitsData.map(formatVisit)
      }
    }
    // Fallback: try marker-based visits if markerId exists
    if (markerId) {
      const marker = await fetchMarkerData(markerId, false)
      if (marker && marker.visits) {
        return marker.visits.map(formatVisit)
      }
    }
    // Final fallback: search markers by address
    const encoded = encodeURIComponent(address)
    const searchResponse = await fetch(`/api/vision-markers/search?address=${encoded}`)
    if (searchResponse.ok) {
      const markers = await searchResponse.json()
      if (markers && markers.length > 0) {
        const allVisits = markers.flatMap((m: any) => m.visits || [])
        return allVisits
          .map(formatVisit)
          .sort((a: Visit, b: Visit) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
    }
    return []
  }

  // --- Fetch visits when modal opens or address/markerId changes ---
  useEffect(() => {
    if (isOpen && address) {
      ;(async () => {
        setIsLoading(true)
        try {
          const visits = await fetchOfficialVisits()
          setPreviousVisits(visits)
          if (!visits.length && markerId) {
            await fetchMarkerData(markerId)
          }
        } catch (error) {
          console.error("Error fetching visits:", error)
          toast({
            title: "Error",
            description: "Failed to fetch visit history",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      })()
    }
  }, [isOpen, address, markerId])

  // Update address in contact info if prop changes
  useEffect(() => {
    if (address) {
      setContactInfo((prev) => ({ ...prev, address }))
    }
  }, [address])

  // --- Event handlers ---
  const handleContactInfoChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleStatusChange = async (value: string) => {
    console.log("Status change:", value)
    setVisitInfo((prev) => ({ ...prev, status: value }))
    setHasChanges(true)
  }

  const handleFollowUpScheduled = (date: Date, time: string, notes: string) => {
    setVisitInfo((prev) => ({
      ...prev,
      followUpDate: date,
      followUpTime: time,
      followUpNotes: notes || null,
    }))
    setHasChanges(true)
  }

  const handleInsuranceInfoUpdate = (info: InsuranceInfo) => {
    setInsuranceInfo(info)
    setHasChanges(true)
  }

  const handleContractDataUpdate = (data: any) => {
    if (JSON.stringify(contractData) !== JSON.stringify(data)) {
      setContractData(data)
      setHasChanges(true)
    }
  }

  const handleVisitInfoChange = (field: keyof VisitInfo, value: string) => {
    setVisitInfo((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // --- Save follow-up event ---
  const saveFollowUpEvent = async (leadId: string | null) => {
    if (!visitInfo.followUpDate || !visitInfo.followUpTime) return
    const { firstName, lastName, address: addr } = contactInfo
    const { followUpDate, followUpTime, followUpNotes } = visitInfo
    try {
      const startDate = new Date(followUpDate)
      const [hourMinute, period] = followUpTime.split(" ")
      let [hours, minutes] = hourMinute.split(":").map(Number)
      if (period === "PM" && hours < 12) hours += 12
      if (period === "AM" && hours === 12) hours = 0
      startDate.setHours(hours, minutes, 0, 0)
      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + 1)
      const eventData = {
        title: `Follow-up Visit: ${firstName} ${lastName} - ${addr}`,
        description: followUpNotes || "Follow-up visit",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        location: addr,
        lead_id: leadId,
        event_type: "Follow-Up",
      }
      const response = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })
      if (!response.ok) {
        throw new Error("Failed to create follow-up event")
      }
      return true
    } catch (error) {
      console.error("Error creating follow-up event:", error)
      toast({
        title: "Warning",
        description: "Failed to create follow-up event",
        variant: "destructive",
      })
      return false
    }
  }

  // --- Save adjuster appointment (unchanged logic) ---
  const saveAdjusterAppointment = async (leadId: string) => {
    if (!adjusterAppointmentDate || !adjusterAppointmentTime) return
    const { firstName, lastName, address: addr } = contactInfo
    try {
      const startDate = new Date(adjusterAppointmentDate)
      const [hourMinute, period] = adjusterAppointmentTime.split(" ")
      let [hours, minutes] = hourMinute.split(":").map(Number)
      if (period === "PM" && hours < 12) hours += 12
      if (period === "AM" && hours === 12) hours = 0
      startDate.setHours(hours, minutes, 0, 0)
      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + 1)
      const eventData = {
        title: `Adjuster Appointment: ${firstName} ${lastName} - ${addr}`,
        description: adjusterAppointmentNotes || "Insurance adjuster appointment",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        location: addr,
        lead_id: leadId,
        event_type: "Adjuster Appointment",
      }
      const response = await fetch("/api/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })
      if (!response.ok) {
        throw new Error("Failed to create adjuster appointment event")
      }
      return true
    } catch (error) {
      console.error("Error creating adjuster appointment event:", error)
      toast({
        title: "Warning",
        description: "Failed to create adjuster appointment event",
        variant: "destructive",
      })
      return false
    }
  }

  // --- Save visit ---
  const saveVisit = async () => {
    try {
      console.log("Starting saveVisit function")
      setIsSaving(true)
      savingRef.current = true
      const session = await getSession()
      console.log("Session data:", session)
      const userName = session?.user?.name || "Unknown"
      const userEmail = session?.user?.email || "unknown@example.com"
      const userId = session?.user?.id || null

      console.log("User details:", { userName, userEmail, userId })

      const newVisit = getNewVisit(visitInfo, userEmail, userName)
      console.log("New visit data:", newVisit)
      
      // Use the current official visits as source
      const allVisits = [newVisit, ...previousVisits]
      console.log("All visits to be saved:", allVisits)
      
      const visitData = {
        lat: position[0],
        lng: position[1],
        address: address,
        notes: visitInfo.notes,
        status: visitInfo.status,
        contactInfo: {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          email: contactInfo.email,
          phone: contactInfo.phone,
        },
        followUpDate: visitInfo.followUpDate ? visitInfo.followUpDate.toISOString() : null,
        followUpTime: visitInfo.followUpTime,
        followUpNotes: visitInfo.followUpNotes,
        salesPersonId: userEmail,
        user_id: userId,
        visits: allVisits,
      }

      console.log("Full visit data being sent:", visitData)

      // Use PUT if we have a markerId, otherwise use POST for new markers
      const url = markerId ? `/api/vision-markers/${markerId}` : "/api/vision-markers"
      const method = markerId ? "PUT" : "POST"
      console.log(`Making ${method} request to ${url}`)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitData),
      })

      console.log("API response status:", response.status)
      console.log("API response headers:", response.headers)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error response data:", errorData)
        throw new Error(`Failed to save visit: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log("Save visit successful response:", responseData)

      // Also update the visits table (if this fails, we log and continue)
      try {
        const visitsResponse = await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            lat: position[0],
            lng: position[1],
            status: visitInfo.status,
            notes: visitInfo.notes,
            followUpDate: visitInfo.followUpDate ? visitInfo.followUpDate.toISOString() : null,
            followUpTime: visitInfo.followUpTime,
            followUpNotes: visitInfo.followUpNotes,
            salesPersonId: userEmail,
            user_id: userId,
          }),
        })
        if (!visitsResponse.ok) {
          console.error("Failed to save to visits table:", visitsResponse.status)
        }
      } catch (error) {
        console.error("Error saving to visits table:", error)
      }

      // Update the marker ID with the one returned from the server
      if (responseData.id) {
        setCreatedLeadId(responseData.id)
      }

      setPreviousVisits(allVisits)
      if (visitInfo.followUpDate && visitInfo.followUpTime) {
        await saveFollowUpEvent(createdLeadId)
      }

      toast({
        title: "Success",
        description: "Visit saved successfully",
        variant: "default",
      })

      setHasChanges(false)
      setVisitSaved(true)
      return true
    } catch (error: any) {
      console.error("Error saving visit:", error)
      toast({
        title: "Error",
        description: `Failed to save visit: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
      return false
    } finally {
      setIsSaving(false)
      savingRef.current = false
    }
  }

  // --- Save contact and create/update lead ---
  const saveContact = async () => {
    try {
      setIsSavingContact(true)
      if (createdLeadId) {
        const response = await fetch(`/api/leads/${createdLeadId}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: contactInfo.firstName,
            lastName: contactInfo.lastName,
            email: contactInfo.email,
            phone: contactInfo.phone,
            address: contactInfo.address,
            streetAddress: contactInfo.address.split(",")[0] || null,
            city: contactInfo.address.split(",")[1]?.trim() || null,
            state: contactInfo.address.split(",")[2]?.trim() || null,
            zipcode: contactInfo.address.split(",")[3]?.trim() || null,
            status: "NEW",
          }),
        })
        if (!response.ok) throw new Error("Failed to update contact information")
        toast({ title: "Success", description: "Contact information updated successfully" })
        setContactSaved(true)
        return true
      } else {
        const leadData = {
          first_name: contactInfo.firstName,
          last_name: contactInfo.lastName,
          email: contactInfo.email,
          phone: contactInfo.phone,
          address: contactInfo.address,
          street_address: contactInfo.address.split(",")[0] || null,
          city: contactInfo.address.split(",")[1]?.trim() || null,
          state: contactInfo.address.split(",")[2]?.trim() || null,
          zipcode: contactInfo.address.split(",")[3]?.trim() || null,
          status: "NEW",
          notes: visitInfo.notes,
          latitude: position[0],
          longitude: position[1],
          insurance_company: insuranceInfo?.company || null,
          insurance_policy_number: insuranceInfo?.policyNumber || null,
          insurance_phone: insuranceInfo?.phone || null,
          insurance_secondary_phone: insuranceInfo?.secondaryPhone || null,
          insurance_adjuster_name: insuranceInfo?.adjusterName || null,
          insurance_adjuster_phone: insuranceInfo?.adjusterPhone || null,
          insurance_adjuster_email: insuranceInfo?.adjusterEmail || null,
          insurance_deductible: insuranceInfo?.deductible || null,
        }
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadData),
        })
        if (!response.ok) throw new Error("Failed to create lead")
        const result = await response.json()
        setCreatedLeadId(result.id)
        toast({ title: "Success", description: "Lead created successfully" })
        setContactSaved(true)
        return true
      }
    } catch (error) {
      console.error("Error saving contact:", error)
      toast({ title: "Error", description: "Failed to save contact information", variant: "destructive" })
      return false
    } finally {
      setIsSavingContact(false)
    }
  }

  // --- Save contract ---
  const saveContract = async () => {
    try {
      setIsSavingContract(true)
      if (!createdLeadId) {
        const contactSaved = await saveContact()
        if (!contactSaved) throw new Error("Failed to create lead for contract")
      }
      const contractFormData = contractRef.current?.getContractData() || contractData
      if (!contractFormData) throw new Error("No contract data available")
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: createdLeadId,
          contract_type: "general",
          contract_data: contractFormData,
        }),
      })
      if (!response.ok) throw new Error("Failed to save contract")
      toast({ title: "Success", description: "Contract saved successfully" })
      setContractSaved(true)
      return true
    } catch (error) {
      console.error("Error saving contract:", error)
      toast({ title: "Error", description: "Failed to save contract", variant: "destructive" })
      return false
    } finally {
      setIsSavingContract(false)
    }
  }

  // --- Modal close with auto-save if unsaved changes exist ---
  const handleModalClose = async (open: boolean) => {
    if (!open && hasChanges && !savingRef.current) {
      setIsSaving(true)
      await saveVisit()
      setIsSaving(false)
    }
    if (!open) onClose()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none w-screen h-screen flex items-center justify-center">
        <div className="relative">
          {!isExpanded ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/20" onClick={onClose} />
              <QuickStatusCard
                address={address}
                position={position}
                status={visitInfo.status}
                onStatusChange={handleStatusChange}
                onExpand={() => setIsExpanded(true)}
                className="relative z-50"
                markerId={markerId}
                onClose={onClose}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl w-[75vw] mx-auto relative z-50"
            >
              <div className="space-y-4">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">{address}</h2>
                </div>

                <Tabs defaultValue="visit" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 bg-gray-200">
                    <TabsTrigger value="visit" className="data-[state=active]:bg-gray-300">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Visit Status
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="data-[state=active]:bg-gray-300">
                      <UserCircle className="h-4 w-4 mr-2" />
                      Contact
                    </TabsTrigger>
                    <TabsTrigger value="contract" className="data-[state=active]:bg-gray-300">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Contract
                    </TabsTrigger>
                    <TabsTrigger value="insurance" className="data-[state=active]:bg-gray-300">
                      <Shield className="h-4 w-4 mr-2" />
                      Insurance
                    </TabsTrigger>
                  </TabsList>

                  {/* Visit Status Tab */}
                  <TabsContent value="visit" className="p-4 bg-gray-100 rounded-b-lg">
                    <div className="space-y-4">
                      {visitInfo.followUpDate && (
                        <div className="flex items-center p-2 bg-blue-900/30 rounded-md border border-blue-700/50">
                          <CalendarDays className="h-5 w-5 mr-2 text-blue-400" />
                          <div>
                            <p className="text-sm text-blue-300">
                              Follow-up scheduled for {format(visitInfo.followUpDate, "MMM d, yyyy")} at{" "}
                              {visitInfo.followUpTime}
                            </p>
                            {visitInfo.followUpNotes && (
                              <p className="text-xs text-blue-400 mt-1">{visitInfo.followUpNotes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-blue-400 hover:text-blue-300 hover:bg-blue-900/50"
                            onClick={() => setFollowUpModalOpen(true)}
                          >
                            Edit
                          </Button>
                        </div>
                      )}

                      {adjusterAppointmentDate && (
                        <div className="flex items-center p-2 bg-orange-900/30 rounded-md border border-orange-700/50">
                          <CalendarDays className="h-5 w-5 mr-2 text-orange-400" />
                          <div>
                            <p className="text-sm text-orange-300">
                              Adjuster appointment scheduled for {format(adjusterAppointmentDate, "MMM d, yyyy")} at{" "}
                              {adjusterAppointmentTime}
                            </p>
                            {adjusterAppointmentNotes && (
                              <p className="text-xs text-orange-400 mt-1">{adjusterAppointmentNotes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-orange-400 hover:text-orange-300 hover:bg-orange-900/50"
                            onClick={() => setAdjusterModalOpen(true)}
                          >
                            Edit
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={visitInfo.notes}
                          onChange={(e) => handleVisitInfoChange('notes', e.target.value)}
                          placeholder="Enter visit notes..."
                          className="bg-white text-black border-gray-300"
                        />
                      </div>

                      {/* Hidden fields for salesperson and date */}
                      <input
                        type="hidden"
                        value={visitInfo.salesPersonId}
                        onChange={(e) => handleVisitInfoChange('salesPersonId', e.target.value)}
                      />
                      <input
                        type="hidden"
                        value={visitInfo.date}
                        onChange={(e) => handleVisitInfoChange('date', e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  {/* Contact Tab */}
                  <TabsContent value="contact" className="p-4 bg-gray-100 text-blackrounded-b-lg">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={contactInfo.firstName}
                          onChange={(e) => handleContactInfoChange("firstName", e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={contactInfo.lastName}
                          onChange={(e) => handleContactInfoChange("lastName", e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <Input
                              id="emailUsername"
                              value={emailUsername}
                              onChange={handleEmailUsernameChange}
                              placeholder="username"
                              className="bg-white border-gray-300 rounded-r-none"
                            />
                            <Input
                              id="emailDomain"
                              value={emailDomain}
                              onChange={(e) => setEmailDomain(e.target.value)}
                              placeholder="@domain.com"
                              className="bg-white border-gray-300 rounded-l-none border-l-0 w-1/2"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmailDomainSelect("@gmail.com")}
                              className="text-xs py-1 h-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              @Gmail.com
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmailDomainSelect("@yahoo.com")}
                              className="text-xs py-1 h-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              @Yahoo.com
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmailDomainSelect("@proton.com")}
                              className="text-xs py-1 h-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              @Proton.com
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={contactInfo.phone}
                          onChange={(e) => handleContactInfoChange("phone", e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={contactInfo.address}
                          onChange={(e) => handleContactInfoChange("address", e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>

                      {createdLeadId && (
                        <Alert className="bg-green-900/30 border-green-700/50 text-green-300">
                          <AlertDescription>
                            Lead #{createdLeadId} has been created. Any changes will update this lead.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={saveContact}
                          disabled={isSavingContact}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSavingContact ? "Saving..." : createdLeadId ? "Update Contact" : "Save Contact"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Contract Tab */}
                  <TabsContent value="contract" className="h-[70vh] overflow-x-hidden overflow-y-auto px-1 sm:px-4 md:px-6 bg-gray-100 text-black">
                    <div className="w-full max-w-full">
                      <GeneralContract
                        ref={contractRef}
                        clientData={{
                          firstName: contactInfo.firstName,
                          lastName: contactInfo.lastName,
                          email: contactInfo.email,
                          phone: contactInfo.phone,
                          address: contactInfo.address,
                        }}
                        onSave={saveContract}
                      />
                    </div>
                  </TabsContent>

                  {/* Insurance Tab */}
                  <TabsContent value="insurance" className="bg-gray-100 rounded-b-lg p-0 text-black">
                    <div className="p-4">
                      {!createdLeadId && (
                        <Alert className="mb-4 bg-amber-900/20 border-amber-700/30">
                          <AlertDescription className="text-amber-300 text-sm">
                            Saving insurance information will automatically create a new lead with your contact information.
                          </AlertDescription>
                        </Alert>
                      )}
                      <InsuranceInfoCard
                        leadId={createdLeadId || "temp"}
                        initialInsuranceInfo={insuranceInfo || undefined}
                        onInsuranceInfoUpdate={handleInsuranceInfoUpdate}
                        previewMode={!createdLeadId}
                        onLeadCreated={(leadId: string) => {
                          if (!createdLeadId) {
                            setCreatedLeadId(leadId)
                            toast({ title: "Success", description: "Lead created successfully" })
                          }
                        }}
                        contactInfo={contactInfo}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4 border-t border-gray-300">
                  <div className="flex gap-2">
                    {activeTab === "contract" && (
                      <Button
                        onClick={saveContract}
                        disabled={isSavingContract}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSavingContract ? "Saving..." : "Save Contract"}
                      </Button>
                    )}
                    {createdLeadId && (
                      <Button
                        onClick={() => router.push(`/leads/${createdLeadId}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Lead Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <FollowUpScheduler
            isOpen={followUpModalOpen}
            onClose={() => setFollowUpModalOpen(false)}
            onScheduled={handleFollowUpScheduled}
            initialDate={visitInfo.followUpDate}
            initialTime={visitInfo.followUpTime || undefined}
            initialNotes={visitInfo.followUpNotes || ""}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
