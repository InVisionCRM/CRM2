"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, X } from "lucide-react"
import debounce from "lodash.debounce"
import { useToast } from "@/components/ui/use-toast"

// Form schema based on Prisma Lead model fields
const adjusterFormSchema = z.object({
  insuranceAdjusterName: z.string().optional().or(z.literal("")),
  insuranceAdjusterPhone: z.string().optional().or(z.literal("")),
  insuranceAdjusterEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  adjusterAppointmentNotes: z.string().optional().or(z.literal("")),
})

type AdjusterFormValues = z.infer<typeof adjusterFormSchema>

interface AdjusterFormProps {
  leadId: string
  leadAddress?: string
  initialData?: Partial<AdjusterFormValues>
  onSuccess?: () => void
  onCancel?: () => void
  isReadOnly?: boolean
}

export function AdjusterForm({
  leadId,
  leadAddress,
  initialData = {},
  onSuccess,
  onCancel,
  isReadOnly = false,
}: AdjusterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const storageKey = `draft-lead-adjuster-${leadId}`
  const { toast } = useToast()

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AdjusterFormValues>({
    resolver: zodResolver(adjusterFormSchema),
    defaultValues: initialData,
  })

  // Watch all form values
  const watchedValues = watch()

  const onSubmit = async (data: AdjusterFormValues) => {
    try {
      await saveAdjusterInfo()
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  // --- Draft Loading ---
  useEffect(() => {
    if (!leadId || isReadOnly) return

    const draft = sessionStorage.getItem(storageKey)
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft)
        setIsDirty(true)
        console.log("Loaded adjuster draft for lead:", leadId)
      } catch (e) {
        console.error("Failed to parse adjuster draft:", e)
        sessionStorage.removeItem(storageKey)
        setIsDirty(false)
      }
    } else {
      setIsDirty(false)
    }
  }, [leadId, storageKey, isReadOnly])

  // --- Draft Saving ---
  const saveDraft = useCallback(
    debounce((data: AdjusterFormValues) => {
      if (leadId && isDirty && !isReadOnly) {
        console.log("Saving adjuster draft for lead:", leadId)
        sessionStorage.setItem(storageKey, JSON.stringify(data))
      }
    }, 500),
    [storageKey, leadId, isDirty, isReadOnly]
  )

  useEffect(() => {
    const hasChanged = JSON.stringify(watchedValues) !== JSON.stringify(initialData)
    if (hasChanged && !isDirty) {
      setIsDirty(true)
    }
    if (isDirty) {
      saveDraft(watchedValues)
    }
    return () => {
      saveDraft.cancel()
    }
  }, [watchedValues, saveDraft, isDirty, initialData])

  const saveAdjusterInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccessMessage(null)

      // Save adjuster information to database
      const response = await fetch(`/api/leads/${leadId}/adjuster`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          insuranceAdjusterName: watchedValues.insuranceAdjusterName,
          insuranceAdjusterPhone: watchedValues.insuranceAdjusterPhone,
          insuranceAdjusterEmail: watchedValues.insuranceAdjusterEmail,
          adjusterAppointmentNotes: watchedValues.adjusterAppointmentNotes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save adjuster information")
      }

      setSuccessMessage("Adjuster information updated successfully")

      // Clear any draft data
      sessionStorage.removeItem(storageKey)
      setIsDirty(false)

      // Call onSuccess callback
      onSuccess?.()
    } catch (err) {
      console.error("Error saving adjuster information:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full relative p-1">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="absolute top-0 right-0 text-white hover:text-gray-300 h-8 w-8 mt-1 mr-1 z-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        )}

        <div className="space-y-1 sm:space-y-2">
          <Label
            htmlFor="insuranceAdjusterName"
            className="text-white text-opacity-90 text-sm sm:text-base"
          >
            Adjuster Name
          </Label>
          <Input
            id="insuranceAdjusterName"
            placeholder="Adjuster's full name"
            {...register("insuranceAdjusterName")}
            disabled={isLoading || isReadOnly}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
          />
          {errors.insuranceAdjusterName && (
            <p className="text-red-400 text-xs mt-1">
              {errors.insuranceAdjusterName.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-1 sm:space-y-2">
            <Label
              htmlFor="insuranceAdjusterPhone"
              className="text-white text-opacity-90 text-sm sm:text-base"
            >
              Adjuster Phone
            </Label>
            <Input
              id="insuranceAdjusterPhone"
              placeholder="Adjuster's phone number"
              {...register("insuranceAdjusterPhone")}
              disabled={isLoading || isReadOnly}
              className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label
              htmlFor="insuranceAdjusterEmail"
              className="text-white text-opacity-90 text-sm sm:text-base"
            >
              Adjuster Email
            </Label>
            <Input
              id="insuranceAdjusterEmail"
              type="email"
              placeholder="Adjuster's email address"
              {...register("insuranceAdjusterEmail")}
              disabled={isLoading || isReadOnly}
              className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 h-10 sm:h-12 text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label
            htmlFor="adjusterAppointmentNotes"
            className="text-white text-opacity-90 text-sm sm:text-base"
          >
            Appointment Notes
          </Label>
          <textarea
            id="adjusterAppointmentNotes"
            placeholder="Enter any notes or instructions for the adjuster appointment"
            {...register("adjusterAppointmentNotes")}
            disabled={isLoading || isReadOnly}
            rows={isMobile ? 3 : 5}
            className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 w-full p-3 rounded-md text-sm sm:text-base"
          />
        </div>

        {!isReadOnly && (
          <div className="pt-2 space-y-2">
            <Button
              type="button"
              onClick={saveAdjusterInfo}
              disabled={isLoading}
              className="bg-zinc-700 hover:bg-zinc-600 text-white h-10 sm:h-12 text-sm sm:text-base w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Info"
              )}
            </Button>

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
          </div>
        )}
      </form>
    </>
  )
}
