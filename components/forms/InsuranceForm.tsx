"use client"

import React, { useState, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, ChevronUp, Check, Calendar, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Custom DatePicker Component
const CustomDatePicker = ({ 
  value = "", 
  onChange, 
  disabled,
  placeholder = "Select date" 
}: { 
  value?: string; 
  onChange: (date: string) => void; 
  disabled?: boolean;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());
  const modalRef = useRef<HTMLDivElement>(null);

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    onChange(format(newDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentMonth);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="w-full">
      <div 
        className={cn(
          "flex items-center justify-between px-5 py-3 bg-white bg-opacity-10 rounded-md cursor-pointer h-[3.5rem]",
          "border border-transparent hover:border-gray-600 text-white w-full text-lg",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <span className={selectedDate ? "text-white" : "text-white text-opacity-50"}>
          {selectedDate ? format(selectedDate, 'MM/dd/yyyy') : placeholder}
        </span>
        <Calendar size={28} className="text-white opacity-70" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div 
            ref={modalRef}
            className="bg-zinc-800 rounded-xl shadow-xl w-full max-w-lg sm:max-w-xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Date picker dialog"
          >
            <div className="p-5 bg-zinc-700 flex justify-between items-center">
              <h3 className="text-white text-xl font-semibold">Select Date</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-zinc-600 rounded-full p-3"
                aria-label="Close date picker"
              >
                <X size={32} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={prevMonth}
                  className="text-white bg-zinc-700 hover:bg-zinc-600 p-4 rounded-full touch-manipulation"
                  aria-label="Previous month"
                >
                  <ChevronUp size={36} className="rotate-270" />
                </button>
                <div className="text-white text-2xl font-medium">
                  {`${monthName} ${currentMonth.getFullYear()}`}
                </div>
                <button 
                  onClick={nextMonth}
                  className="text-white bg-zinc-700 hover:bg-zinc-600 p-4 rounded-full touch-manipulation"
                  aria-label="Next month"
                >
                  <ChevronDown size={36} className="rotate-90" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-3">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-gray-400 text-base font-medium py-3">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}

                {Array.from({ length: daysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = selectedDate && 
                    selectedDate.getDate() === day && 
                    selectedDate.getMonth() === currentMonth.getMonth() && 
                    selectedDate.getFullYear() === currentMonth.getFullYear();
                  
                  const dateString = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'MMMM d, yyyy');
                  
                  return (
                    <button
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        "h-14 w-14 sm:h-16 sm:w-16 rounded-full text-white flex items-center justify-center text-xl touch-manipulation",
                        isSelected 
                          ? "bg-lime-600 font-bold" 
                          : "hover:bg-zinc-700"
                      )}
                      aria-label={dateString}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 bg-zinc-700 flex justify-end space-x-4">
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-zinc-600 hover:bg-zinc-500 text-white px-6 py-3 h-14 text-lg"
                type="button"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-lime-600 hover:bg-lime-700 text-white px-6 py-3 h-14 text-lg"
                type="button"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Insurance company list with phone numbers
const INSURANCE_COMPANIES = [
  { name: "Not Listed", phone: "", secondaryPhone: null },
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
]

// Damage type options
const DAMAGE_TYPES = [
  { value: "HAIL", label: "Hail" },
  { value: "WIND", label: "Wind" },
  { value: "FIRE", label: "Fire" }
]

// Form schema based on Prisma Lead model fields
const insuranceFormSchema = z.object({
  insuranceCompany: z.string().optional().or(z.literal("")),
  customInsuranceCompany: z.string().optional().or(z.literal("")),
  insurancePolicyNumber: z.string().optional().or(z.literal("")),
  insurancePhone: z.string().optional().or(z.literal("")),
  insuranceDeductible: z.string().optional().or(z.literal("")),
  insuranceSecondaryPhone: z.string().optional().or(z.literal("")),
  dateOfLoss: z.string().optional().or(z.literal("")),
  damageType: z.enum(["HAIL", "WIND", "FIRE"]).optional().or(z.literal("")),
  claimNumber: z.string().optional().or(z.literal(""))
})

type InsuranceFormValues = z.infer<typeof insuranceFormSchema>

interface InsuranceFormProps {
  leadId: string
  initialData?: Partial<InsuranceFormValues>
  onSuccess?: () => void
  isReadOnly?: boolean
}

export function InsuranceForm({
  leadId,
  initialData = {},
  onSuccess,
  isReadOnly = false
}: InsuranceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isCustomCompany, setIsCustomCompany] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [damageTypeDropdownOpen, setDamageTypeDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const damageTypeDropdownRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: initialData
  })

  const selectedCompany = watch("insuranceCompany")
  const selectedDamageType = watch("damageType")

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (damageTypeDropdownRef.current && !damageTypeDropdownRef.current.contains(event.target as Node)) {
        setDamageTypeDropdownOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Set initial custom company state
  useEffect(() => {
    if (initialData.insuranceCompany) {
      const company = INSURANCE_COMPANIES.find(c => c.name === initialData.insuranceCompany)
      if (!company || company.name === "Not Listed") {
        setIsCustomCompany(true)
        setValue("customInsuranceCompany", initialData.insuranceCompany)
      }
    }
  }, [initialData, setValue])

  // Handle company selection
  useEffect(() => {
    if (selectedCompany) {
      const company = INSURANCE_COMPANIES.find(c => c.name === selectedCompany)
      if (company) {
        if (company.name === "Not Listed") {
          setIsCustomCompany(true)
          setValue("insurancePhone", "")
          setValue("insuranceSecondaryPhone", "")
        } else {
          setIsCustomCompany(false)
          setValue("insurancePhone", company.phone)
          setValue("insuranceSecondaryPhone", company.secondaryPhone || "")
        }
      }
    }
  }, [selectedCompany, setValue])

  const handleCompanySelect = (companyName: string) => {
    setValue("insuranceCompany", companyName)
    
    // Immediately update phone numbers when company changes
    const company = INSURANCE_COMPANIES.find(c => c.name === companyName)
    if (company) {
      if (company.name === "Not Listed") {
        setIsCustomCompany(true)
        setValue("insurancePhone", "")
        setValue("insuranceSecondaryPhone", "")
      } else {
        setIsCustomCompany(false)
        setValue("insurancePhone", company.phone)
        setValue("insuranceSecondaryPhone", company.secondaryPhone || "")
      }
    }
    
    setDropdownOpen(false)
  }

  const handleDamageTypeSelect = (damageType: string) => {
    setValue("damageType", damageType as "HAIL" | "WIND" | "FIRE")
    setDamageTypeDropdownOpen(false)
  }

  const onSubmit = async (data: InsuranceFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Prepare data for submission
      const submissionData = {
        ...data,
        // Use custom company name if "Not Listed" is selected
        insuranceCompany: data.insuranceCompany === "Not Listed" ? data.customInsuranceCompany : data.insuranceCompany
      }
      
      // Remove customInsuranceCompany as it's not part of the API schema
      delete submissionData.customInsuranceCompany

      // Call API route to update insurance information
      const response = await fetch(`/api/leads/${leadId}/insurance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submissionData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update insurance information")
      }

      setSuccessMessage("Insurance information updated successfully")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Custom dropdown component for damage type
  const DamageTypeDropdown = () => (
    <div className="relative" ref={damageTypeDropdownRef}>
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3 bg-white bg-opacity-10 rounded-md cursor-pointer h-[3.5rem]",
          "border border-transparent hover:border-gray-600 text-white w-full text-lg",
        )}
        onClick={() => !isReadOnly && !isLoading && setDamageTypeDropdownOpen(!damageTypeDropdownOpen)}
      >
        <span className={selectedDamageType ? "text-white" : "text-white text-opacity-50"}>
          {selectedDamageType ? DAMAGE_TYPES.find(d => d.value === selectedDamageType)?.label : "Select damage type"}
        </span>
        <span>{damageTypeDropdownOpen ? <ChevronUp size={28} /> : <ChevronDown size={28} />}</span>
      </div>
      
      {damageTypeDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {DAMAGE_TYPES.map((damageType) => (
            <div
              key={damageType.value}
              className={cn(
                "px-5 py-4 cursor-pointer hover:bg-zinc-700 flex justify-between items-center text-lg",
                selectedDamageType === damageType.value ? "bg-zinc-700" : ""
              )}
              onClick={() => handleDamageTypeSelect(damageType.value)}
            >
              <span className="text-white">{damageType.label}</span>
              {selectedDamageType === damageType.value && <Check size={24} className="text-green-400" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Custom dropdown component for insurance company
  const CompanyDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3 bg-white bg-opacity-10 rounded-md cursor-pointer h-[3.5rem]",
          "border border-transparent hover:border-gray-600 text-white w-full text-lg"
        )}
        onClick={() => !isReadOnly && !isLoading && setDropdownOpen(!dropdownOpen)}
      >
        <span className={selectedCompany ? "text-white" : "text-white text-opacity-50"}>
          {selectedCompany || "Select insurance company"}
        </span>
        <span>{dropdownOpen ? <ChevronUp size={28} /> : <ChevronDown size={28} />}</span>
      </div>
      
      {dropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {INSURANCE_COMPANIES.map((company) => (
            <div
              key={company.name}
              className={cn(
                "px-5 py-4 cursor-pointer hover:bg-zinc-700 flex justify-between items-center text-lg",
                selectedCompany === company.name ? "bg-zinc-700" : ""
              )}
              onClick={() => handleCompanySelect(company.name)}
            >
              <span className="text-white">{company.name}</span>
              {selectedCompany === company.name && <Check size={24} className="text-green-400" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          transform: scale(1.5);
          margin-right: 6px;
        }
        
        /* Force larger text sizes on all relevant elements */
        .form-label {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em !important;
        }
        
        input, select, .input-text, .dropdown-text {
          font-size: 1.25rem !important;
        }
        
        input::placeholder {
          font-size: 1.25rem !important;
        }
        
        button.submit-button {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
        }
      `}</style>
      
      {/* Row 1: Insurance Company / Policy Number */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="insuranceCompany" className="form-label text-white text-opacity-90 text-2xl font-bold">
            Insurance Company
          </Label>
          <input
            type="hidden"
            {...register("insuranceCompany")}
          />
          <CompanyDropdown />
          
          {isCustomCompany && (
            <div className="mt-2">
              <Input
                id="customInsuranceCompany"
                placeholder="Enter insurance company name"
                {...register("customInsuranceCompany")}
                disabled={isLoading || isReadOnly}
                className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="insurancePolicyNumber" className="form-label text-white text-opacity-90 text-2xl font-bold">
            Policy Number
          </Label>
          <Input
            id="insurancePolicyNumber"
            placeholder="Policy number"
            {...register("insurancePolicyNumber")}
            disabled={isLoading || isReadOnly}
            className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
          />
        </div>
      </div>
      
      {/* Row 2: Insurance Phone / Secondary Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="insurancePhone" className="form-label text-white text-opacity-90 text-2xl font-bold">
            Insurance Phone
          </Label>
          <Input
            id="insurancePhone"
            placeholder="Insurance company phone"
            {...register("insurancePhone")}
            disabled={isLoading || isReadOnly}
            className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="insuranceSecondaryPhone" className="form-label text-white text-opacity-90 text-2xl font-bold">
            Secondary Phone
          </Label>
          <Input
            id="insuranceSecondaryPhone"
            placeholder="Secondary phone (optional)"
            {...register("insuranceSecondaryPhone")}
            disabled={isLoading || isReadOnly}
            className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
          />
        </div>
      </div>
      
      {/* Row 3: Date of Loss / Damage Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfLoss" className="form-label text-white text-opacity-90 text-2xl font-bold">
            Date of Loss
          </Label>
          <Controller
            name="dateOfLoss"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                value={field.value}
                onChange={(date) => field.onChange(date)}
                disabled={isLoading || isReadOnly}
                placeholder="Select date of loss"
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="damageType" className="form-label text-white text-opacity-90 text-2xl font-bold">
            Damage Type
          </Label>
          <input
            type="hidden"
            {...register("damageType")}
          />
          <DamageTypeDropdown />
        </div>
      </div>
      
      {/* Row 4: Deductible / Claim Number */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="insuranceDeductible" className="form-label text-white text-opacity-90 text-2xl font-bold">
            Deductible
          </Label>
          <Input
            id="insuranceDeductible"
            placeholder="Deductible amount"
            {...register("insuranceDeductible")}
            disabled={isLoading || isReadOnly}
            className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="claimNumber" className="form-label text-white text-opacity-90 text-2xl font-bold">
            Claim Number
          </Label>
          <Input
            id="claimNumber"
            placeholder="Claim number"
            {...register("claimNumber")}
            disabled={isLoading || isReadOnly}
            className="input-text bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-[4rem] px-5 py-3 text-xl w-full"
          />
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-500 bg-opacity-20 p-4 text-red-200 text-xl">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded bg-green-500 bg-opacity-20 p-4 text-green-200 text-xl">
          {successMessage}
        </div>
      )}

      {!isReadOnly && (
        <Button
          type="submit"
          disabled={isLoading}
          className="submit-button w-full bg-lime-600 hover:bg-lime-700 text-white h-[4rem] text-2xl font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-3 h-7 w-7 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Insurance Info"
          )}
        </Button>
      )}
    </form>
  )
} 