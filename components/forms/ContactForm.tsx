"use client"

import React, { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Mail } from "lucide-react"

// Form schema based on Prisma Lead model fields
const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  streetAddress: z.string().optional().or(z.literal("")), // Keep as optional string
  city: z.string().optional().or(z.literal("")),          // Keep as optional string
  state: z.string().optional().or(z.literal("")),         // Keep as optional string
  zipcode: z.string().optional().or(z.literal(""))         // Keep as optional string
})

type ContactFormValues = z.infer<typeof contactFormSchema>

interface ContactFormProps {
  leadId: string
  initialData?: Partial<ContactFormValues>
  onSuccess?: () => void
  isReadOnly?: boolean
}

export function ContactForm({
  leadId,
  initialData = {},
  onSuccess,
  isReadOnly = false
}: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [emailPrefix, setEmailPrefix] = useState<string>("")
  const [isMobile, setIsMobile] = useState(false)
  
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
    formState: { errors },
    reset,
    setValue,
    watch,
    control
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: initialData
  })

  // Watch the email field to extract the prefix
  const emailValue = watch("email") || "";
  
  useEffect(() => {
    // Extract prefix part before @ if it exists
    const atIndex = emailValue.indexOf('@');
    if (atIndex >= 0) {
      setEmailPrefix(emailValue.substring(0, atIndex));
    } else {
      setEmailPrefix(emailValue);
    }
  }, [emailValue]);

  const completeEmailWithDomain = (domain: string) => {
    // If there's an @ already, replace everything after it
    const atIndex = emailValue.indexOf('@');
    const prefix = atIndex >= 0 ? emailValue.substring(0, atIndex) : emailValue;
    
    // Set the new email value
    setValue("email", `${prefix}${domain}`, { shouldValidate: true });
  };

  const onSubmit = async (data: ContactFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Call API route to update lead contact information
      const response = await fetch(`/api/leads/${leadId}/contact`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update contact information")
      }

      setSuccessMessage("Contact information updated successfully")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const emailDomainButtonStyle = {
    backgroundColor: "#000000",
    color: "#84cc16", // lime-600
    border: "none",
    height: "100%",
    padding: isMobile ? "0 5px" : "0 10px", // Keep dynamic padding for now
    fontWeight: "bold",
    fontSize: isMobile ? "0.7rem" : "0.9rem", // Keep dynamic font size for now
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 w-full">
      {/* First Name / Last Name Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-1.5">
          <Label htmlFor="firstName" className="text-white text-opacity-90 text-xs sm:text-sm">
            First Name
          </Label>
          <Input
            id="firstName"
            placeholder="First name"
            {...register("firstName")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-9 sm:h-10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
          />
          {errors.firstName && (
            <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-1 sm:space-y-1.5">
          <Label htmlFor="lastName" className="text-white text-opacity-90 text-xs sm:text-sm">
            Last Name
          </Label>
          <Input
            id="lastName"
            placeholder="Last name"
            {...register("lastName")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-9 sm:h-10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
          />
          {errors.lastName && (
            <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1 sm:space-y-1.5">
        <Label htmlFor="email" className="text-white text-opacity-90 text-xs sm:text-sm">
          Email
        </Label>
        <div className="flex">
          <div className="relative flex-1">
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              {...register("email")}
              disabled={isLoading || isReadOnly}
              className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 w-full h-9 sm:h-10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
          </div>
          {/* Email domain buttons - styling adjusted slightly */}
          <button
            type="button"
            onClick={() => completeEmailWithDomain('@gmail.com')}
            disabled={isLoading || isReadOnly}
            style={{
              ...emailDomainButtonStyle,
              borderRight: "1px solid rgba(255,255,255,0.1)",
              // Adjust font-size/padding via style prop if needed based on isMobile state
            }}
          >
            @GMAIL
          </button>
          <button
            type="button"
            onClick={() => completeEmailWithDomain('@yahoo.com')}
            disabled={isLoading || isReadOnly}
            style={{
              ...emailDomainButtonStyle,
              borderTopRightRadius: "0.25rem", // Adjusted to match smaller input radius potentially
              borderBottomRightRadius: "0.25rem",
               // Adjust font-size/padding via style prop if needed based on isMobile state
            }}
          >
            @YAHOO
          </button>
        </div>
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1 sm:space-y-1.5">
        <Label htmlFor="phone" className="text-white text-opacity-90 text-xs sm:text-sm">
          Phone
        </Label>
        <Input
          id="phone"
          placeholder="Phone number"
          {...register("phone")}
          disabled={isLoading || isReadOnly}
          className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-9 sm:h-10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
        />
        {errors.phone && (
          <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Street Address */}
      <div className="space-y-1 sm:space-y-1.5">
        <Label htmlFor="streetAddress" className="text-white text-opacity-90 text-xs sm:text-sm">
          Street Address
        </Label>
        <Input
          id="streetAddress"
          placeholder="Street address"
          {...register("streetAddress")}
          disabled={isLoading || isReadOnly}
          className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-9 sm:h-10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
        />
        {/* No error message needed here unless schema adds validation */}
      </div>

      {/* City / State / Zip Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-1.5">
          <Label htmlFor="city" className="text-white text-opacity-90 text-xs sm:text-sm">
            City
          </Label>
          <Input
            id="city"
            placeholder="City"
            {...register("city")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-9 sm:h-10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
          />
          {/* No error message needed here unless schema adds validation */}
        </div>
        <div className="space-y-1 sm:space-y-1.5">
          <Label htmlFor="state" className="text-white text-opacity-90 text-xs sm:text-sm">
            State / Province
          </Label>
          <Input
            id="state"
            placeholder="State / Province"
            {...register("state")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-9 sm:h-10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
          />
          {/* No error message needed here unless schema adds validation */}
        </div>
        <div className="space-y-1 sm:space-y-1.5">
          <Label htmlFor="zipcode" className="text-white text-opacity-90 text-xs sm:text-sm">
            Zip / Postal Code
          </Label>
          <Input
            id="zipcode"
            placeholder="Zip / Postal Code"
            {...register("zipcode")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-9 sm:h-10 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
          />
          {/* No error message needed here unless schema adds validation */}
        </div>
      </div>


      {/* Submit Button & Messages */}
      {!isReadOnly && (
        <div className="pt-2">
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-lime-600 hover:bg-lime-700 text-white h-9 sm:h-10 text-xs sm:text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Contact Info"
            )}
          </Button>
          
          {error && (
            <div className="mt-2 text-red-400 text-xs p-2 bg-red-900 bg-opacity-25 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mt-2 text-green-400 text-xs p-2 bg-green-900 bg-opacity-25 rounded">
              {successMessage}
            </div>
          )}
        </div>
      )}
    </form>
  )
} 