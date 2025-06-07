"use client"

import React, { useState, useRef, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { LeadStatus } from "@prisma/client"
import { useRouter } from "next/navigation"
import AsyncSelect from "react-select/async"
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
    google: any
  }
}

export function CreateLeadForm({ open, onOpenChange, onSuccess }: CreateLeadFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailPrefix, setEmailPrefix] = useState<string>("")
  const [placesService, setPlacesService] = useState<any>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

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
                      backgroundColor: "rgb(0 0 0 / 0.8)",
                      borderColor: "rgb(255 255 255 / 0.2)",
                      "&:hover": {
                        borderColor: "rgb(255 255 255 / 0.3)",
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "rgb(0 0 0 / 0.8)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgb(255 255 255 / 0.2)",
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? "rgb(255 255 255 / 0.1)" : "transparent",
                      color: "white",
                      cursor: "pointer",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "white",
                    }),
                    input: (base) => ({
                      ...base,
                      color: "white",
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
