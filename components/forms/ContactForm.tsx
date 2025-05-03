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
  // Keep these in the schema for API compatibility, but we won't show them in the UI
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
      // Extract city, state, zip from street address if possible
      const addressParts = data.streetAddress?.split(',').map(part => part.trim()) || [];
      if (addressParts.length >= 3) {
        // Try to parse "7900 Mortenview Drive, Taylor, Michigan 48180, United States" format
        const lastPart = addressParts[addressParts.length - 2] || ""; // e.g. "Michigan 48180"
        const stateZipMatch = lastPart.match(/([A-Za-z\s]+)\s+(\d+)/);
        
        if (stateZipMatch) {
          data.state = stateZipMatch[1]; // e.g. "Michigan"
          data.zipcode = stateZipMatch[2]; // e.g. "48180"
        }
        
        // City is typically the part before state
        data.city = addressParts[addressParts.length - 3] || "";
      }

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
    padding: "0 10px",
    fontWeight: "bold",
    fontSize: "0.9rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-white text-opacity-90">
            First Name
          </Label>
          <Input
            id="firstName"
            placeholder="First name"
            {...register("firstName")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50"
          />
          {errors.firstName && (
            <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-white text-opacity-90">
            Last Name
          </Label>
          <Input
            id="lastName"
            placeholder="Last name"
            {...register("lastName")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50"
          />
          {errors.lastName && (
            <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white text-opacity-90">
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
              className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 w-full"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
          </div>
          
          {/* Email domain buttons at the end of the field */}
          <button
            type="button"
            onClick={() => completeEmailWithDomain('@gmail.com')}
            disabled={isLoading || isReadOnly}
            style={{
              ...emailDomainButtonStyle,
              borderRight: "1px solid rgba(255,255,255,0.1)",
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
              borderTopRightRadius: "0.375rem",
              borderBottomRightRadius: "0.375rem",
            }}
          >
            @YAHOO
          </button>
        </div>
        
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-white text-opacity-90">
          Phone
        </Label>
        <Input
          id="phone"
          placeholder="Phone number"
          {...register("phone")}
          disabled={isLoading || isReadOnly}
          className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50"
        />
        {errors.phone && (
          <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="streetAddress" className="text-white text-opacity-90">
          Street Address
        </Label>
        <Input
          id="streetAddress"
          placeholder="Full address (including city, state, zip)"
          {...register("streetAddress")}
          disabled={isLoading || isReadOnly}
          className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50"
        />
      </div>

      {/* Hidden inputs for city, state, zipcode - still part of the form data */}
      <input type="hidden" {...register("city")} />
      <input type="hidden" {...register("state")} />
      <input type="hidden" {...register("zipcode")} />

      {error && (
        <div className="rounded bg-red-500 bg-opacity-20 p-2 text-red-200 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded bg-green-500 bg-opacity-20 p-2 text-green-200 text-sm">
          {successMessage}
        </div>
      )}

      {!isReadOnly && (
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-lime-600 hover:bg-lime-700 text-white"
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
      )}
    </form>
  )
} 