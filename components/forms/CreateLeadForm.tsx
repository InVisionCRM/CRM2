"use client"

import React, { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { LeadStatus } from "@prisma/client"
import { useRouter } from "next/navigation"
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

const createLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  status: z.string(),
  notes: z.string().optional().or(z.literal("")),
})

type CreateLeadFormValues = z.infer<typeof createLeadSchema>

interface CreateLeadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (leadId: string) => void
}

declare global {
  interface Window {
    google: any;
    initAutocomplete: () => void;
  }
}

export function CreateLeadForm({ open, onOpenChange, onSuccess }: CreateLeadFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailPrefix, setEmailPrefix] = useState<string>("")
  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<any>(null)
  const scriptLoadedRef = useRef(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
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
    },
  })

  const emailValue = watch("email") || ""

  useEffect(() => {
    const atIndex = emailValue.indexOf("@")
    setEmailPrefix(atIndex >= 0 ? emailValue.substring(0, atIndex) : emailValue)
  }, [emailValue])

  useEffect(() => {
    if (!open || scriptLoadedRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true
    script.defer = true
    script.onload = () => {
      scriptLoadedRef.current = true
      initializeAutocomplete()
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script)
      }
    }
  }, [open])

  useEffect(() => {
    if (!open || !scriptLoadedRef.current || !addressInputRef.current || !window.google?.maps?.places) return

    initializeAutocomplete()
  }, [open])

  const initializeAutocomplete = () => {
    if (!addressInputRef.current) return

    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current)
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["formatted_address", "address_components"],
    })

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace()
      if (place?.formatted_address) {
        setValue("address", place.formatted_address, { shouldValidate: true })
      }
    })

    autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace()
        if (place?.formatted_address) {
          addressInputRef.current!.value = place.formatted_address  // <-- ADD THIS LINE
          setValue("address", place.formatted_address, { shouldValidate: true })
        }
      })      
  }

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .pac-container {
        z-index: 9999 !important;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 0.375rem;
      }
    `
    document.head.appendChild(style)
    return () => {
      if (style.parentNode) {
        document.head.removeChild(style)
      }
    }
  }, [])

  const completeEmailWithDomain = (domain: string) => {
    const atIndex = emailValue.indexOf("@")
    const prefix = atIndex >= 0 ? emailValue.substring(0, atIndex) : emailValue
    setValue("email", `${prefix}${domain}`, { shouldValidate: true })
  }

  const onSubmit = async (data: CreateLeadFormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      const apiData = { ...data }
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      })

      // Even if there's an error response, the lead might have been created successfully
      // Let's try to parse the response first
      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
      }

      if (result && result.id) {
        // If we got an ID back, the lead was created successfully
        reset()
        onOpenChange(false)
        
        // Refresh the router to update any cached data
        router.refresh()
        
        // Navigate to the lead detail page
        router.push(`/leads/${result.id}`)
        
        // Also call onSuccess if provided
        onSuccess?.(result.id)
        return
      }

      // If we didn't get an ID and the response wasn't ok, throw an error
      if (!response.ok) {
        let msg = "Failed to create lead"
        if (result && result.error) {
          msg = result.error
        }
        throw new Error(msg)
      }

      // If we get here, the response was ok but didn't include an ID
      // This shouldn't happen, but just in case
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>Enter the lead's contact info.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full relative p-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="First name" {...register("first_name")} disabled={isLoading} autoComplete="off" />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="lastName" placeholder="Last name" {...register("last_name")} disabled={isLoading} autoComplete="off" />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex">
              <div className="relative flex-1">
                <Input id="email" type="email" placeholder="Email address" {...register("email")} disabled={isLoading} className="w-full pr-20" autoComplete="off" />
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
            <Input id="phone" placeholder="Phone number" {...register("phone")} disabled={isLoading} autoComplete="off" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <Input id="address" placeholder="Start typing address" disabled={isLoading} autoComplete="off" ref={addressInputRef} className="pr-10" />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <img src="https://developers.google.com/maps/documentation/images/powered_by_google_on_white.png" alt="Powered by Google" className="h-5 opacity-70" />
              </div>
            </div>
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select defaultValue={LeadStatus.follow_ups} onValueChange={(value) => setValue("status", value)} disabled={isLoading}>
              <SelectTrigger id="status">
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
            <Input id="notes" placeholder="Additional notes" {...register("notes")} disabled={isLoading} autoComplete="off" />
          </div>

          {error && <div className="rounded bg-red-500 bg-opacity-20 p-2 text-red-500 text-sm">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-lime-600 hover:bg-lime-700 text-black">
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>) : "Create Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
