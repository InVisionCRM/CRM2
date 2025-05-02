"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Edit, Save, X, CalendarDays, Phone, Mail, DollarSign } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { AdjusterAppointmentScheduler } from "@/components/adjuster-appointment-scheduler"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { updateInsuranceInfoAction } from "@/app/actions/lead-actions"

// Top Insurance Companies in Michigan with their phone numbers:
const insuranceCompanies = [
  { name: "State Farm", phone: "800-782-8332", secondaryPhone: "800-732-5246" },
  { name: "Auto-Owners Insurance", phone: "517-323-1200", secondaryPhone: "800-346-0346" },
  { name: "Allstate", phone: "800-255-7828", secondaryPhone: "800-669-2214" },
  { name: "Progressive", phone: "800-776-4737", secondaryPhone: "800-274-4499" },
  { name: "AAA / The Auto Club Group", phone: "800-222-8252", secondaryPhone: "800-672-5246" },
  { name: "Liberty Mutual", phone: "800-290-8711", secondaryPhone: "800-837-5254" },
  { name: "Farmers Insurance", phone: "888-327-6335", secondaryPhone: "800-435-7764" },
  { name: "MEEMIC Insurance Company", phone: "800-333-2252", secondaryPhone: null },
  { name: "Citizens Insurance Company of America", phone: "800-333-0606", secondaryPhone: null },
  { name: "Frankenmuth Insurance", phone: "800-234-1133", secondaryPhone: "989-652-6121" },
  { name: "Farm Bureau Insurance of Michigan", phone: "517-323-7000", secondaryPhone: "800-292-2680" },
  { name: "Nationwide", phone: "877-669-6877", secondaryPhone: "800-421-3535" },
  { name: "USAA", phone: "800-531-8722", secondaryPhone: "800-531-8111" },
  { name: "Travelers", phone: "800-252-4633", secondaryPhone: "800-238-6225" },
  { name: "Geico", phone: "800-207-7847", secondaryPhone: "800-841-3000" },
  { name: "Hastings Mutual", phone: "800-442-8277", secondaryPhone: null },
  { name: "Pioneer State Mutual", phone: "800-783-9935", secondaryPhone: null },
  { name: "Grange Insurance", phone: "800-422-0550", secondaryPhone: "800-247-2643" },
  { name: "Wolverine Mutual Insurance", phone: "800-733-3320", secondaryPhone: null },
  { name: "Home-Owners Insurance", phone: "517-323-1200", secondaryPhone: "800-346-0346" },
  { name: "Hanover Insurance", phone: "800-922-8427", secondaryPhone: null },
  { name: "Cincinnati Insurance", phone: "888-242-8811", secondaryPhone: "800-635-7521" },
  { name: "Chubb", phone: "800-252-4670", secondaryPhone: "800-682-4822" },
  { name: "MetLife", phone: "800-638-5433", secondaryPhone: "800-422-4272" },
  { name: "Hartford", phone: "860-547-5000", secondaryPhone: "800-243-5860" },
  { name: "Erie Insurance", phone: "800-458-0811", secondaryPhone: "800-367-3743" },
  { name: "American Family Insurance", phone: "800-692-6326", secondaryPhone: "800-374-1111" },
  { name: "Safeco Insurance", phone: "800-332-3226", secondaryPhone: null },
  { name: "Westfield Insurance", phone: "800-243-0210", secondaryPhone: null },
  { name: "Auto Club Insurance Association", phone: "800-222-6424", secondaryPhone: null },
  { name: "Not Listed", phone: "", secondaryPhone: null },
]

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

interface InsuranceInfoCardProps {
  leadId: string
  initialInsuranceInfo?: InsuranceInfo
  appointmentDate?: Date | null
  appointmentTime?: string | null
  appointmentNotes?: string | null
  onInsuranceInfoUpdate?: (info: InsuranceInfo) => void
  previewMode?: boolean
  onLeadCreated?: (leadId: string) => void
  contactInfo?: any
}

export function InsuranceInfoCard({
  leadId,
  initialInsuranceInfo,
  appointmentDate,
  appointmentTime,
  appointmentNotes,
  onInsuranceInfoUpdate,
  previewMode,
  onLeadCreated,
  contactInfo,
}: InsuranceInfoCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(!initialInsuranceInfo)
  const [isSaving, setIsSaving] = useState(false)
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)

  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo>(
    initialInsuranceInfo || {
      company: "",
      policyNumber: "",
      phone: "",
      secondaryPhone: null,
      adjusterName: "",
      adjusterPhone: "",
      adjusterEmail: "",
      deductible: "",
    },
  )

  // For change detection & updates
  const handleInputChange = (field: keyof InsuranceInfo, value: string) => {
    const newInfo = { ...insuranceInfo, [field]: value === "" ? null : value }
    setInsuranceInfo(newInfo)
    onInsuranceInfoUpdate?.(newInfo)
  }

  // For picking a company from the big array
  const handleCompanyChange = (companyName: string) => {
    const company = insuranceCompanies.find((c) => c.name === companyName)
    if (company) {
      const newInfo = {
        ...insuranceInfo,
        company: companyName,
        phone: company.phone || "",
        secondaryPhone: company.secondaryPhone || null,
      }
      setInsuranceInfo(newInfo)
      onInsuranceInfoUpdate?.(newInfo)
    } else {
      handleInputChange("company", companyName)
    }
  }

  // Save to DB via updateInsuranceInfoAction
  const handleSave = async () => {
    try {
      setIsSaving(true)
      const result = await updateInsuranceInfoAction(leadId, insuranceInfo)
      if (result.success) {
        toast({
          title: "Success",
          description: "Insurance information updated successfully",
        })
        setIsEditing(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update insurance information",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating insurance information:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel reverts to initial data
  const handleCancel = () => {
    if (initialInsuranceInfo) {
      setInsuranceInfo(initialInsuranceInfo)
      setIsEditing(false)
    }
  }

  return (
    <Card className="w-full max-w-full h-full overflow-x-hidden">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4">
        <CardTitle className="flex items-center w-full">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Insurance Information
        </CardTitle>

        {/* Appointment + Edit/Save Buttons */}
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            className={
              appointmentDate ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"
            }
            onClick={() => setAppointmentDialogOpen(true)}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            {appointmentDate ? "View Appointment" : "Schedule Appointment"}
          </Button>

          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-primary text-white">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      {/* Main Content */}
      <CardContent className="pt-6 w-full max-w-full overflow-x-hidden">
        {isEditing ? (
          <div className="space-y-6">
            {/* Company select & policy info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Insurance Company */}
              <div className="space-y-1">
                <Label htmlFor="company">Insurance Company</Label>
                <select
                  id="company"
                  aria-label="Insurance Company"
                  value={insuranceInfo.company || ""}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                >
                  <option value="">Select Insurance Company</option>
                  {insuranceCompanies.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Policy Number */}
              <div className="space-y-1">
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  value={insuranceInfo.policyNumber || ""}
                  onChange={(e) => handleInputChange("policyNumber", e.target.value)}
                />
              </div>
            </div>

            {/* Phone fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="phone">Insurance Phone</Label>
                <Input
                  id="phone"
                  value={insuranceInfo.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                <Input
                  id="secondaryPhone"
                  value={insuranceInfo.secondaryPhone || ""}
                  onChange={(e) => handleInputChange("secondaryPhone", e.target.value)}
                />
              </div>
            </div>

            {/* Adjuster fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="adjusterName">Adjuster Name</Label>
                <Input
                  id="adjusterName"
                  value={insuranceInfo.adjusterName || ""}
                  onChange={(e) => handleInputChange("adjusterName", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adjusterPhone">Adjuster Phone</Label>
                <Input
                  id="adjusterPhone"
                  value={insuranceInfo.adjusterPhone || ""}
                  onChange={(e) => handleInputChange("adjusterPhone", e.target.value)}
                />
              </div>
            </div>

            {/* Adjuster Email & Deductible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="adjusterEmail">Adjuster Email</Label>
                <Input
                  id="adjusterEmail"
                  value={insuranceInfo.adjusterEmail || ""}
                  onChange={(e) => handleInputChange("adjusterEmail", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deductible">Deductible</Label>
                <Input
                  id="deductible"
                  value={insuranceInfo.deductible || ""}
                  onChange={(e) => handleInputChange("deductible", e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          // Display Mode
          <>
            {initialInsuranceInfo ? (
              <div className="space-y-4">
                {/* Company */}
                {initialInsuranceInfo.company && (
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Insurance Company</div>
                      <div className="text-muted-foreground">{initialInsuranceInfo.company}</div>
                    </div>
                  </div>
                )}

                {/* Policy Number */}
                {initialInsuranceInfo.policyNumber && (
                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Policy Number</div>
                      <div className="text-muted-foreground">{initialInsuranceInfo.policyNumber}</div>
                    </div>
                  </div>
                )}

                {/* Insurance Phone */}
                {initialInsuranceInfo.phone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Insurance Phone</div>
                      <div className="flex items-center">
                        <a
                          href={`tel:${initialInsuranceInfo.phone}`}
                          className="text-primary hover:underline break-all"
                        >
                          {initialInsuranceInfo.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secondary Phone */}
                {initialInsuranceInfo.secondaryPhone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Secondary Phone</div>
                      <div className="flex items-center">
                        <a
                          href={`tel:${initialInsuranceInfo.secondaryPhone}`}
                          className="text-primary hover:underline break-all"
                        >
                          {initialInsuranceInfo.secondaryPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adjuster Name */}
                {initialInsuranceInfo.adjusterName && (
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Adjuster Name</div>
                      <div className="text-muted-foreground">{initialInsuranceInfo.adjusterName}</div>
                    </div>
                  </div>
                )}

                {/* Adjuster Phone */}
                {initialInsuranceInfo.adjusterPhone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Adjuster Phone</div>
                      <div className="flex items-center">
                        <a
                          href={`tel:${initialInsuranceInfo.adjusterPhone}`}
                          className="text-primary hover:underline break-all"
                        >
                          {initialInsuranceInfo.adjusterPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adjuster Email */}
                {initialInsuranceInfo.adjusterEmail && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Adjuster Email</div>
                      <div className="flex items-center">
                        <a
                          href={`mailto:${initialInsuranceInfo.adjusterEmail}`}
                          className="text-primary hover:underline break-all"
                        >
                          {initialInsuranceInfo.adjusterEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Deductible */}
                {initialInsuranceInfo.deductible && (
                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Deductible</div>
                      <div className="text-muted-foreground">
                        {initialInsuranceInfo.deductible ? `$${initialInsuranceInfo.deductible}` : "Not specified"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No insurance information provided.</p>
                <Button onClick={() => setIsEditing(true)} className="mt-4">
                  Add Insurance Info
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Dialog for scheduling adjuster appointment */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-purlin-white">
          <DialogHeader>
            <DialogTitle className="text-purlin-white">Adjuster Appointment</DialogTitle>
            <DialogDescription className="text-gray-400">Schedule or manage the adjuster appointment</DialogDescription>
          </DialogHeader>
          <AdjusterAppointmentScheduler
            leadId={leadId}
            initialDate={appointmentDate ? new Date(appointmentDate) : null}
            initialTime={appointmentTime}
            initialNotes={appointmentNotes || ""}
            onScheduled={() => {
              setAppointmentDialogOpen(false)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
