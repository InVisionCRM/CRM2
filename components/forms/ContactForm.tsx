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
  streetAddress: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipcode: z.string().optional().or(z.literal(""))
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
      // Validate leadId
      if (!leadId) {
        throw new Error("Lead ID is required")
      }

      // Call API route to update lead contact information
      const response = await fetch(`/api/leads/${leadId}/contact`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || "",
          phone: data.phone || "",
          streetAddress: data.streetAddress || "",
          city: data.city || "",
          state: data.state || "",
          zipcode: data.zipcode || ""
        })
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
    color: "#84cc16",
    border: "none",
    height: "100%",
    padding: "0 4px",
    fontWeight: "bold",
    fontSize: "0.65rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
  };

  const baseInputStyles = "bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-4 text-xs px-2"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1 w-full max-w-full">
      {/* ROW 1: First Name / Last Name */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <Label htmlFor="firstName" className="text-white text-opacity-90 text-[10px]">
            First Name
          </Label>
          <Input
            id="firstName"
            placeholder="First name"
            {...register("firstName")}
            disabled={isLoading || isReadOnly}
            className={baseInputStyles}
          />
          {errors.firstName && (
            <p className="text-red-400 text-[10px]">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="lastName" className="text-white text-opacity-90 text-[10px]">
            Last Name
          </Label>
          <Input
            id="lastName"
            placeholder="Last name"
            {...register("lastName")}
            disabled={isLoading || isReadOnly}
            className={baseInputStyles}
          />
          {errors.lastName && (
            <p className="text-red-400 text-[10px]">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* ROW 2: Email */}
      <div className="space-y-0.5">
        <Label htmlFor="email" className="text-white text-opacity-90 text-[10px]">
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
              className={`${baseInputStyles} w-full`}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
          </div>
          {/* Email domain buttons */}
          <button
            type="button"
            onClick={() => completeEmailWithDomain('@gmail.com')}
            disabled={isLoading || isReadOnly}
            style={{
              ...emailDomainButtonStyle,
              borderRight: "1px solid rgba(255,255,255,0.1)",
            }}
            title="Add @gmail.com"
          >
            G
          </button>
          <button
            type="button"
            onClick={() => completeEmailWithDomain('@yahoo.com')}
            disabled={isLoading || isReadOnly}
            style={{
              ...emailDomainButtonStyle,
              borderTopRightRadius: "0.125rem",
              borderBottomRightRadius: "0.125rem",
            }}
            title="Add @yahoo.com"
          >
            Y
          </button>
        </div>
        {errors.email && (
          <p className="text-red-400 text-[10px]">{errors.email.message}</p>
        )}
      </div>

      {/* ROW 3: Phone */}
      <div className="space-y-0.5">
        <Label htmlFor="phone" className="text-white text-opacity-90 text-[10px]">
          Phone
        </Label>
        <Input
          id="phone"
          placeholder="Phone number"
          {...register("phone")}
          disabled={isLoading || isReadOnly}
          className={baseInputStyles}
        />
        {errors.phone && (
          <p className="text-red-400 text-[10px]">{errors.phone.message}</p>
        )}
      </div>

      {/* ROW 4: Street Address / Zip Code */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-0.5">
          <Label htmlFor="streetAddress" className="text-white text-opacity-90 text-[10px]">
            Street Address
          </Label>
          <Input
            id="streetAddress"
            placeholder="Street address"
            {...register("streetAddress")}
            disabled={isLoading || isReadOnly}
            className={baseInputStyles}
          />
        </div>
        
        <div className="space-y-0.5">
          <Label htmlFor="zipcode" className="text-white text-opacity-90 text-[10px]">
            Zip Code
          </Label>
          <Input
            id="zipcode"
            placeholder="Zip Code"
            {...register("zipcode")}
            disabled={isLoading || isReadOnly}
            className={baseInputStyles}
          />
        </div>
      </div>

      {/* ROW 5: City / State */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <Label htmlFor="city" className="text-white text-opacity-90 text-[10px]">
            City
          </Label>
          <Input
            id="city"
            placeholder="City"
            {...register("city")}
            disabled={isLoading || isReadOnly}
            className={baseInputStyles}
          />
        </div>
        
        <div className="space-y-0.5">
          <Label htmlFor="state" className="text-white text-opacity-90 text-[10px]">
            State
          </Label>
          <Input
            id="state"
            placeholder="State"
            {...register("state")}
            disabled={isLoading || isReadOnly}
            className={baseInputStyles}
          />
        </div>
      </div>

      {/* ROW 6: Save Button */}
      {!isReadOnly && (
        <div>
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-lime-600 hover:bg-lime-700 text-white h-4 text-[10px] mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1 h-2 w-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Contact Info"
            )}
          </Button>
          
          {error && (
            <div className="mt-0.5 text-red-400 text-[10px] p-0.5 bg-red-900 bg-opacity-25 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mt-0.5 text-green-400 text-[10px] p-0.5 bg-green-900 bg-opacity-25 rounded">
              {successMessage}
            </div>
          )}
        </div>
      )}
    </form>
  )
} 