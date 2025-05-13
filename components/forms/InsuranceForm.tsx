"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, ChevronUp, Check, Calendar, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import debounce from 'lodash.debounce'

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
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

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
          "flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 bg-white bg-opacity-10 rounded-md cursor-pointer",
          "border border-transparent hover:border-gray-600 text-white w-full text-sm sm:text-lg h-10 sm:h-[3.5rem]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <span className={selectedDate ? "text-white" : "text-white text-opacity-50"}>
          {selectedDate ? format(selectedDate, 'MM/dd/yyyy') : placeholder}
        </span>
        <Calendar size={isMobile ? 20 : 28} className="text-white opacity-70" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div 
            ref={modalRef}
            className="bg-zinc-800 rounded-xl shadow-xl w-full max-w-sm sm:max-w-lg overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Date picker dialog"
          >
            <div className="p-3 sm:p-5 bg-zinc-700 flex justify-between items-center">
              <h3 className="text-white text-base sm:text-xl font-semibold">Select Date</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-zinc-600 rounded-full p-2 sm:p-3"
                aria-label="Close date picker"
              >
                <X size={isMobile ? 24 : 32} />
              </button>
            </div>

            <div className="p-2 sm:p-4 md:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <button 
                  onClick={prevMonth}
                  className="text-white bg-zinc-700 hover:bg-zinc-600 p-2 sm:p-4 rounded-full touch-manipulation"
                  aria-label="Previous month"
                >
                  <ChevronUp size={isMobile ? 24 : 36} className="rotate-270" />
                </button>
                <div className="text-white text-lg sm:text-2xl font-medium">
                  {`${monthName} ${currentMonth.getFullYear()}`}
                </div>
                <button 
                  onClick={nextMonth}
                  className="text-white bg-zinc-700 hover:bg-zinc-600 p-2 sm:p-4 rounded-full touch-manipulation"
                  aria-label="Next month"
                >
                  <ChevronDown size={isMobile ? 24 : 36} className="rotate-90" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-gray-400 text-xs sm:text-base font-medium py-1 sm:py-3">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: firstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-1 sm:p-2"></div>
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
                        "h-8 w-8 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full text-white flex items-center justify-center text-xs sm:text-base md:text-xl touch-manipulation",
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

            <div className="p-3 sm:p-5 bg-zinc-700 flex justify-end space-x-2 sm:space-x-4">
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-zinc-600 hover:bg-zinc-500 text-white px-3 sm:px-6 py-2 sm:py-3 h-9 sm:h-14 text-sm sm:text-lg"
                type="button"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setIsOpen(false)}
                className="bg-lime-600 hover:bg-lime-700 text-white px-3 sm:px-6 py-2 sm:py-3 h-9 sm:h-14 text-sm sm:text-lg"
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
  { name: "Not Listed", phone: "", secondaryPhone: null },
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
  { value: "FIRE", label: "Fire" }
]

// Form schema based on Prisma Lead model fields
const insuranceFormSchema = z.object({
  insuranceCompany: z.string().optional().or(z.literal("")),
  customInsuranceCompany: z.string().optional().or(z.literal("")),
  insurancePhone: z.string().optional().or(z.literal("")),
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
  onCancel?: () => void
  isReadOnly?: boolean
}

export function InsuranceForm({
  leadId,
  initialData = {},
  onSuccess,
  onCancel,
  isReadOnly = false
}: InsuranceFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isCustomCompany, setIsCustomCompany] = useState(false)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showDamageTypeDropdown, setShowDamageTypeDropdown] = useState(false)
  const companyDropdownRef = useRef<HTMLDivElement>(null)
  const damageTypeDropdownRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const storageKey = `draft-lead-insurance-${leadId}`

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // --- Draft Loading ---
  useEffect(() => {
    if (!leadId || isReadOnly) return;

    const draft = sessionStorage.getItem(storageKey);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // Check if the loaded draft has a custom company name scenario
        const company = INSURANCE_COMPANIES.find(c => c.name === parsedDraft.insuranceCompany);
        if (!company || company.name === "Not Listed") {
          setIsCustomCompany(true);
        } else {
          setIsCustomCompany(false);
        }
        reset(parsedDraft);
        setIsDirty(true);
        console.log("Loaded insurance draft for lead:", leadId);
      } catch (e) {
        console.error("Failed to parse insurance draft:", e);
        sessionStorage.removeItem(storageKey);
        reset(initialData); // Fallback
        setIsDirty(false);
        const initialCompany = INSURANCE_COMPANIES.find(c => c.name === initialData.insuranceCompany);
        setIsCustomCompany(!initialCompany || initialCompany.name === "Not Listed");
      }
    } else {
      reset(initialData);
      setIsDirty(false);
      const initialCompany = INSURANCE_COMPANIES.find(c => c.name === initialData.insuranceCompany);
      setIsCustomCompany(!initialCompany || initialCompany.name === "Not Listed");
    }
  }, [leadId, storageKey, reset, initialData, isReadOnly]);

  // --- Draft Saving ---
  const watchedValues = watch();

  const saveDraft = useCallback(
    debounce((data: InsuranceFormValues) => {
      if (leadId && isDirty && !isReadOnly) {
        console.log("Saving insurance draft for lead:", leadId);
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      }
    }, 500),
    [storageKey, leadId, isDirty, isReadOnly]
  );

  useEffect(() => {
    const hasChanged = JSON.stringify(watchedValues) !== JSON.stringify(initialData);
    if(hasChanged && !isDirty) {
       setIsDirty(true);
    }
    if (isDirty) {
      saveDraft(watchedValues);
    }
    return () => {
      saveDraft.cancel();
    };
  }, [watchedValues, saveDraft, isDirty, initialData]);

  const selectedCompany = watchedValues.insuranceCompany
  const selectedDamageType = watchedValues.damageType

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

  // Handle company selection
  useEffect(() => {
    if (selectedCompany) {
      const company = INSURANCE_COMPANIES.find(c => c.name === selectedCompany)
      if (company) {
        if (company.name === "Not Listed") {
          setIsCustomCompany(true)
          // Don't clear phone numbers if user might be editing them from a draft
          // setValue("insurancePhone", "");
          // setValue("insuranceSecondaryPhone", "");
        } else {
          setIsCustomCompany(false)
          // Only set if the current value is empty or matches the default, to avoid overwriting draft edits
          if (!watchedValues.insurancePhone || watchedValues.insurancePhone === INSURANCE_COMPANIES.find(c => c.name === initialData.insuranceCompany)?.phone) {
            setValue("insurancePhone", company.phone)
          }
          if (!watchedValues.insuranceSecondaryPhone || watchedValues.insuranceSecondaryPhone === INSURANCE_COMPANIES.find(c => c.name === initialData.insuranceCompany)?.secondaryPhone) {
             setValue("insuranceSecondaryPhone", company.secondaryPhone || "")
          }
        }
      }
    }
  }, [selectedCompany, setValue, initialData.insuranceCompany, watchedValues.insurancePhone, watchedValues.insuranceSecondaryPhone])

  const handleCompanySelect = (companyName: string) => {
    setValue("insuranceCompany", companyName, { shouldDirty: true })
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
    setShowCompanyDropdown(false)
  }

  const handleDamageTypeSelect = (damageType: string) => {
    setValue("damageType", damageType as "HAIL" | "WIND" | "FIRE", { shouldDirty: true })
    setShowDamageTypeDropdown(false)
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
      sessionStorage.removeItem(storageKey)
      setIsDirty(false)
      reset(submissionData as InsuranceFormValues)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // --- Discard Draft ---
  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard unsaved changes?")) {
      sessionStorage.removeItem(storageKey);
      reset(initialData);
      setIsDirty(false);
      // Reset custom company state based on initialData
      const initialCompany = INSURANCE_COMPANIES.find(c => c.name === initialData.insuranceCompany);
      setIsCustomCompany(!initialCompany || initialCompany.name === "Not Listed");
      console.log("Discarded insurance draft for lead:", leadId);
    }
  };

  // Custom dropdown component for damage type
  const DamageTypeDropdown = () => (
    <div className="relative" ref={damageTypeDropdownRef}>
      <div
        className={cn(
          "flex items-center justify-between px-3 sm:p-4 bg-white bg-opacity-10 rounded-md cursor-pointer h-10 sm:h-12",
          "border border-transparent",
          showDamageTypeDropdown ? "hover:border-gray-600" : "cursor-not-allowed opacity-70",
          "text-sm sm:text-base"
        )}
        onClick={() => !isReadOnly && !isLoading && setShowDamageTypeDropdown(!showDamageTypeDropdown)}
      >
        <span className={selectedDamageType ? "text-white" : "text-white text-opacity-50"}>
          {selectedDamageType ? DAMAGE_TYPES.find(d => d.value === selectedDamageType)?.label : "Select damage type"}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 text-white text-opacity-70" />
      </div>
      
      {showDamageTypeDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {DAMAGE_TYPES.map((damageType) => (
            <div
              key={damageType.value}
              className={cn(
                "px-3 sm:px-4 py-4 cursor-pointer hover:bg-zinc-700 flex justify-between items-center text-sm sm:text-base",
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
    <div className="relative" ref={companyDropdownRef}>
      <div
        className={cn(
          "flex items-center justify-between px-1 sm:p-1 bg-white bg-opacity-10 rounded-md cursor-pointer h-10 sm:h-12",
          "border border-transparent",
          showCompanyDropdown ? "hover:border-gray-600" : "cursor-not-allowed opacity-70",
          "text-sm sm:text-base"
        )}
        onClick={() => !isReadOnly && !isLoading && setShowCompanyDropdown(!showCompanyDropdown)}
      >
        <span className={selectedCompany ? "text-white" : "text-white text-opacity-50"}>
          {selectedCompany || "Select insurance company"}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 text-white text-opacity-70" />
      </div>
      
      {showCompanyDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {INSURANCE_COMPANIES.map((company) => (
            <div
              key={company.name}
              className={cn(
                "px-3 sm:px-4 py-4 cursor-pointer hover:bg-zinc-700 flex justify-between items-center text-sm sm:text-base",
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full relative p-1">
      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="absolute top-0 right-0 text-white hover:text-gray-300 h-8 w-8 mt-1 mr-1"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      )}

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          transform: scale(1);
          margin-right: 6px;
        }
        
        /* Force larger text sizes on all relevant elements */
        .form-label {
          font-size: 1rem !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em !important;
        }
        
        input, select, .input-text, .dropdown-text {
          font-size: 1rem !important;
        }
        
        input::placeholder {
          font-size: .75rem !important;
        }
        
        button.submit-button {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
        }
      `}</style>
      
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="insuranceCompany" className="text-white text-opacity-90 text-sm sm:text-base">
            Insurance Company
          </Label>
          <div className="relative">
            <CompanyDropdown />
          </div>
          {isCustomCompany && (
            <Input
              id="customInsuranceCompany"
              placeholder="Enter company name"
              {...register("customInsuranceCompany")}
              disabled={isLoading || isReadOnly}
              className="mt-2 bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
            />
          )}
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="claimNumber" className="text-white text-opacity-90 text-sm sm:text-base">
            Claim Number
          </Label>
          <Input
            id="claimNumber"
            placeholder="Enter claim number (if available)"
            {...register("claimNumber")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="insurancePhone" className="text-white text-opacity-90 text-sm sm:text-base">
            Insurance Phone
          </Label>
          <Input
            id="insurancePhone"
            placeholder="Primary phone number"
            {...register("insurancePhone")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
          />
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="insuranceSecondaryPhone" className="text-white text-opacity-90 text-sm sm:text-base">
            Secondary Phone
          </Label>
          <Input
            id="insuranceSecondaryPhone"
            placeholder="Optional secondary number"
            {...register("insuranceSecondaryPhone")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="dateOfLoss" className="text-white text-opacity-90 text-sm sm:text-base">
            Date of Loss
          </Label>
          <Controller
            name="dateOfLoss"
            control={control}
            render={({ field }) => (
              <CustomDatePicker
                value={field.value}
                onChange={(date) => {
                  field.onChange(date);
                  setIsDirty(true);
                }}
                disabled={isLoading || isReadOnly}
                placeholder="Select date of loss"
              />
            )}
          />
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="damageType" className="text-white text-opacity-90 text-sm sm:text-base">
            Damage Type
          </Label>
          <div className="relative">
            <DamageTypeDropdown />
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <div className="pt-2 flex items-center gap-2">
          <Button
            type="submit"
            disabled={isLoading || !isDirty}
            className="flex-grow bg-lime-600 hover:bg-lime-700 text-black h-10 sm:h-12 text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Insurance Info"
            )}
          </Button>
          {isDirty && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDiscard}
              disabled={isLoading}
              className="flex-shrink-0 h-10 sm:h-12 text-black"
              aria-label="Discard changes"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 text-red-400 text-sm p-3 bg-red-900 bg-opacity-25 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mt-3 text-green-400 text-sm p-3 bg-green-900 bg-opacity-25 rounded">
          {successMessage}
        </div>
      )}
    </form>
  )
} 