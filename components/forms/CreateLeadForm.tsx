"use client"

import React, { useState, useRef, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, Check } from "lucide-react"
import { LeadStatus } from "@prisma/client"
import { useRouter } from "next/navigation"
import AsyncSelect from "react-select/async"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Insurance company list with phone numbers
const INSURANCE_COMPANIES = [
  { name: "AAA / The Auto Club Group", phone: "800-222-8252", secondaryPhone: "800-672-5246" },
  { name: "Allstate", phone: "800-255-7828", secondaryPhone: "800-669-2214" },
  { name: "American Family Insurance", phone: "800-692-6326", secondaryPhone: "800-374-1111" },
  { name: "Auto Club Insurance Association", phone: "800-222-6424", secondaryPhone: null },
  { name: "Auto-Owners Insurance", phone: "517-323-1200", secondaryPhone: "800-346-0346" },
  { name: "Chubb", phone: "800-252-4670", secondaryPhone: "800-682-4822" },
  { name: "Cincinnati Insurance", phone: "888-242-8811", secondaryPhone: "800-635-7521" },
  { name: "Citizens Insurance Company of America", phone: "800-333-0606", secondaryPhone: null },
  { name: "Erie Insurance", phone: "800-458-0811", secondaryPhone: "800-367-3743" },
  { name: "Farm Bureau Insurance of Michigan", phone: "517-323-7000", secondaryPhone: "800-292-2680" },
  { name: "Farmers Insurance", phone: "888-327-6335", secondaryPhone: "800-435-7764" },
  { name: "Frankenmuth Insurance", phone: "800-234-1133", secondaryPhone: "989-652-6121" },
  { name: "Geico", phone: "800-207-7847", secondaryPhone: "800-841-3000" },
  { name: "Grange Insurance", phone: "800-422-0550", secondaryPhone: "800-247-2643" },
  { name: "Hanover Insurance", phone: "800-922-8427", secondaryPhone: null },
  { name: "Hartford", phone: "860-547-5000", secondaryPhone: "800-243-5860" },
  { name: "Hastings Mutual", phone: "800-442-8277", secondaryPhone: null },
  { name: "Home-Owners Insurance", phone: "517-323-1200", secondaryPhone: "800-346-0346" },
  { name: "Liberty Mutual", phone: "800-290-8711", secondaryPhone: "800-837-5254" },
  { name: "MEEMIC Insurance Company", phone: "800-333-2252", secondaryPhone: null },
  { name: "MetLife", phone: "800-638-5433", secondaryPhone: "800-422-4272" },
  { name: "Nationwide", phone: "877-669-6877", secondaryPhone: "800-421-3535" },
  { name: "Pioneer State Mutual", phone: "800-783-9935", secondaryPhone: null },
  { name: "Progressive", phone: "800-776-4737", secondaryPhone: "800-274-4499" },
  { name: "Safeco Insurance", phone: "800-332-3226", secondaryPhone: null },
  { name: "State Farm", phone: "800-782-8332", secondaryPhone: "800-732-5246" },
  { name: "Travelers", phone: "800-252-4633", secondaryPhone: "800-238-6225" },
  { name: "USAA", phone: "800-531-8722", secondaryPhone: "800-531-8111" },
  { name: "Westfield Insurance", phone: "800-243-0210", secondaryPhone: null },
  { name: "Wolverine Mutual Insurance", phone: "800-733-3320", secondaryPhone: null }
];

// Damage type options
const DAMAGE_TYPES = [
  { value: "HAIL", label: "Hail" },
  { value: "WIND", label: "Wind" },
  { value: "FIRE", label: "Fire" },
  { value: "WIND_AND_HAIL", label: "Wind and Hail" }
]

// Combined schema for contact and insurance information
const createLeadSchema = z.object({
  // Contact fields
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  status: z.string(),
  notes: z.string().optional().or(z.literal("")),
  // Insurance fields (all optional)
  insuranceCompany: z.string().optional().or(z.literal("")),
  insuranceEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  insurancePhone: z.string().optional().or(z.literal("")),
  insuranceSecondaryPhone: z.string().optional().or(z.literal("")),
  insuranceDeductible: z.string().optional().or(z.literal("")),
  dateOfLoss: z.string().optional().or(z.literal("")),
  damageType: z.enum(["HAIL", "WIND", "FIRE", "WIND_AND_HAIL"]).optional().or(z.literal("")),
  claimNumber: z.string().optional().or(z.literal("")),
  insurancePolicyNumber: z.string().optional().or(z.literal(""))
})

type CreateLeadFormValues = z.infer<typeof createLeadSchema>

interface CreateLeadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (leadId: string) => void
}

declare global {
  interface Window {
    google: any
  }
}

export function CreateLeadForm({ open, onOpenChange, onSuccess }: CreateLeadFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placesService, setPlacesService] = useState<any>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [activeTab, setActiveTab] = useState("contact")
  
  // Insurance-related state

  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showDamageTypeDropdown, setShowDamageTypeDropdown] = useState(false)
  const companyDropdownRef = useRef<HTMLDivElement>(null)
  const damageTypeDropdownRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      status: LeadStatus.follow_ups,
      notes: "",
      // Insurance defaults - start with dropdown
          insuranceCompany: "",
      insuranceEmail: "",
      insurancePhone: "",
      insuranceSecondaryPhone: "",
      insuranceDeductible: "",
      dateOfLoss: "",
      damageType: "",
      claimNumber: "",
      insurancePolicyNumber: ""
    },
  })

  useEffect(() => {
    if (!open) return
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || scriptRef.current) return

    scriptRef.current = document.createElement("script")
    scriptRef.current.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    scriptRef.current.async = true
    scriptRef.current.onload = () => {
      setPlacesService(new window.google.maps.places.AutocompleteService())
    }
    document.head.appendChild(scriptRef.current)

    return () => {
      if (scriptRef.current?.parentNode) {
        document.head.removeChild(scriptRef.current)
        scriptRef.current = null
      }
    }
  }, [open])

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false)
      }
      if (damageTypeDropdownRef.current && !damageTypeDropdownRef.current.contains(event.target as Node)) {
        setShowDamageTypeDropdown(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const loadAddressOptions = (inputValue: string) => {
    return new Promise<any[]>((resolve) => {
      if (!inputValue || !placesService) {
        resolve([])
        return
      }

      placesService.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: { country: "us" },
          types: ["address"],
        },
        (predictions: any[] | null) => {
          if (!predictions) {
            resolve([])
            return
          }

          const options = predictions.map((prediction) => ({
            label: prediction.description,
            value: prediction.description,
          }))
          resolve(options)
        }
      )
    })
  }

  const emailValue = watch("email") || ""
  const selectedCompany = watch("insuranceCompany")
  const selectedDamageType = watch("damageType")

  const completeEmailWithDomain = (domain: string) => {
    const atIndex = emailValue.indexOf("@")
    const prefix = atIndex >= 0 ? emailValue.substring(0, atIndex) : emailValue
    setValue("email", `${prefix}${domain}`, { shouldValidate: true })
  }

  // Handle company selection
  const handleCompanySelect = (companyName: string) => {
    setValue("insuranceCompany", companyName, { shouldDirty: true })
    const company = INSURANCE_COMPANIES.find(c => c.name === companyName)
    if (company) {
      setValue("insurancePhone", company.phone)
      setValue("insuranceSecondaryPhone", company.secondaryPhone || "")
    }
    setShowCompanyDropdown(false)
  }

  const handleDamageTypeSelect = (damageType: string) => {
    setValue("damageType", damageType as "HAIL" | "WIND" | "FIRE" | "WIND_AND_HAIL", { shouldDirty: true })
    setShowDamageTypeDropdown(false)
  }



  const onSubmit = async (data: CreateLeadFormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      // Prepare data for submission
      const submissionData = {
        ...data
      }

      console.log("Form data being submitted:", submissionData);

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      })

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
      }

      if (result && result.id) {
        reset()
        onOpenChange(false)
        router.refresh()
        router.push(`/leads/${result.id}`)
        onSuccess?.(result.id)
        return
      }

      if (!response.ok) {
        let msg = "Failed to create lead"
        if (result && result.error) {
          msg = result.error
        }
        throw new Error(msg)
      }

      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>Enter the lead's contact and insurance information.</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contact">Contact Information</TabsTrigger>
            <TabsTrigger value="insurance">Insurance Information</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full relative p-1">
            <TabsContent value="contact" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="First name" {...register("first_name")} disabled={isLoading} autoComplete="off" className="bg-gray-300/50 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50" />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="lastName" placeholder="Last name" {...register("last_name")} disabled={isLoading} autoComplete="off" className="bg-gray-300/50 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50" />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex">
                  <div className="relative flex-1">
                    <Input id="email" type="email" placeholder="Email address" {...register("email")} disabled={isLoading} className="w-full pr-20 bg-gray-300/50 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50" autoComplete="off" />
                    <div className="absolute right-0 top-0 h-full flex items-center">
                      <button type="button" onClick={() => completeEmailWithDomain("@gmail.com")} disabled={isLoading} className="px-1.5 h-full">G</button>
                      <button type="button" onClick={() => completeEmailWithDomain("@yahoo.com")} disabled={isLoading} className="px-1.5 h-full">Y</button>
                    </div>
                  </div>
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="Phone number" {...register("phone")} disabled={isLoading} autoComplete="off" className="bg-gray-300/50 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      {...field}
                      id="address"
                      loadOptions={loadAddressOptions}
                      placeholder="Start typing an address..."
                      isDisabled={isLoading}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      onChange={(option: any) => {
                        field.onChange(option?.value || "")
                      }}
                      value={field.value ? { label: field.value, value: field.value } : null}
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: "rgba(203, 213, 225, 0.5)",
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: "rgba(203, 213, 225, 0.5)",
                        }),
                        option: (base) => ({
                          ...base,
                          color: "#0f172a",
                          cursor: "pointer",
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: "#0f172a",
                        }),
                        input: (base) => ({
                          ...base,
                          color: "#0f172a",
                        }),
                      }}
                    />
                  )}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={LeadStatus.follow_ups} onValueChange={(value) => setValue("status", value)} disabled={isLoading}>
                  <SelectTrigger id="status" className="bg-gray-300/50 text-slate-950">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadStatus).map((status) => (
                      <SelectItem key={status} value={status}>{status.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" placeholder="Additional notes" {...register("notes")} disabled={isLoading} autoComplete="off" className="bg-gray-300/50 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50" />
              </div>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="insuranceCompany" className="text-slate-950 text-opacity-90 text-sm sm:text-base">
                    Insurance Company
                  </Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="insuranceCompany"
                        placeholder="Enter insurance company name"
                        {...register("insuranceCompany")}
                        disabled={isLoading}
                        className="bg-gray-300/50 bg-opacity-10 border-0 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium cursor-pointer mt-1"
                        disabled={isLoading}
                      >
                        Open Insurance List
                      </button>
                      {showCompanyDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-300 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
                          {INSURANCE_COMPANIES.map((company) => (
                            <div
                              key={company.name}
                              className={cn(
                                "px-3 sm:px-4 py-4 cursor-pointer hover:bg-gray-400 flex justify-between items-center text-sm sm:text-base",
                                selectedCompany === company.name ? "bg-gray-400" : ""
                              )}
                              onClick={() => handleCompanySelect(company.name)}
                            >
                              <span className="text-slate-950">{company.name}</span>
                              {selectedCompany === company.name && <Check size={24} className="text-green-400" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="insurancePolicyNumber" className="text-slate-950 text-opacity-90 text-sm sm:text-base">
                    Policy Number
                  </Label>
                  <Input
                    id="insurancePolicyNumber"
                    placeholder="Enter policy number"
                    {...register("insurancePolicyNumber")}
                    disabled={isLoading}
                    className="bg-gray-300/50 bg-opacity-10 border-0 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="claimNumber" className="text-slate-950 text-opacity-90 text-sm sm:text-base">
                    Claim Number
                  </Label>
                  <Input
                    id="claimNumber"
                    placeholder="Enter claim number (if available)"
                    {...register("claimNumber")}
                    disabled={isLoading}
                    className="bg-gray-300/50 bg-opacity-10 border-0 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="insuranceEmail" className="text-slate-950 text-opacity-90 text-sm sm:text-base">
                    Insurance Email
                  </Label>
                  <Input
                    id="insuranceEmail"
                    type="email"
                    placeholder="Enter insurance email"
                    {...register("insuranceEmail")}
                    disabled={isLoading}
                    className="bg-gray-300/50 bg-opacity-10 border-0 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
                  />
                  {errors.insuranceEmail && <p className="text-red-500 text-xs mt-1">{errors.insuranceEmail.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="insurancePhone" className="text-slate-950 text-opacity-90 text-sm sm:text-base">
                    Insurance Phone
                  </Label>
                  <Input
                    id="insurancePhone"
                    placeholder="Primary phone number"
                    {...register("insurancePhone")}
                    disabled={isLoading}
                    className="bg-gray-300/50 bg-opacity-10 border-0 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="insuranceSecondaryPhone" className="text-slate-950 text-opacity-90 text-sm sm:text-base">
                    Secondary Phone
                  </Label>
                  <Input
                    id="insuranceSecondaryPhone"
                    placeholder="Optional secondary number"
                    {...register("insuranceSecondaryPhone")}
                    disabled={isLoading}
                    className="bg-gray-300/50 bg-opacity-10 border-0 text-slate-950 placeholder:text-slate-950 placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="dateOfLoss" className="text-slate-950 text-opacity-90 text-sm sm:text-base">
                    Date of Loss
                  </Label>
                  <Controller
                    name="dateOfLoss"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="dateOfLoss"
                        placeholder="MM/DD/YY"
                        className="bg-gray-300/50 bg-opacity-10 border-transparent hover:border-gray-600 text-slate-950 h-10 sm:h-12"
                        maxLength={8}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2);
                          }
                          if (value.length >= 5) {
                            value = value.slice(0, 5) + '/' + value.slice(5);
                          }
                          if (value.length > 8) {
                            value = value.slice(0, 8);
                          }
                          field.onChange(value);
                        }}
                        disabled={isLoading}
                      />
                    )}
                  />
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="damageType" className="text-slate-950 text-opacity-90 text-sm sm:text-base">
                    Damage Type
                  </Label>
                  <div className="relative" ref={damageTypeDropdownRef}>
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 sm:p-4 bg-gray-300/50 bg-opacity-10 rounded-md cursor-pointer h-10 sm:h-12",
                        "border border-transparent hover:border-gray-600",
                        "text-sm sm:text-base"
                      )}
                      onClick={() => !isLoading && setShowDamageTypeDropdown(!showDamageTypeDropdown)}
                    >
                      <span className={selectedDamageType ? "text-slate-950" : "text-slate-950 text-opacity-50"}>
                        {selectedDamageType ? DAMAGE_TYPES.find(d => d.value === selectedDamageType)?.label : "Select damage type"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 text-slate-950 text-opacity-70" />
                    </div>

                    {showDamageTypeDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-300 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {DAMAGE_TYPES.map((damageType) => (
                          <div
                            key={damageType.value}
                            className={cn(
                              "px-3 sm:px-4 py-4 cursor-pointer hover:bg-gray-400 flex justify-between items-center text-sm sm:text-base",
                              selectedDamageType === damageType.value ? "bg-gray-400" : ""
                            )}
                            onClick={() => handleDamageTypeSelect(damageType.value)}
                          >
                            <span className="text-slate-950">{damageType.label}</span>
                            {selectedDamageType === damageType.value && <Check size={24} className="text-green-400" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {error && <div className="rounded bg-red-500 bg-opacity-20 p-2 text-red-500 text-sm">{error}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="bg-lime-600 hover:bg-lime-700 text-white">
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>) : "Create Lead"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
