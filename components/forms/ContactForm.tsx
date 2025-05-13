"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Trash2, X } from "lucide-react"
import debounce from 'lodash.debounce'; // Import debounce

// Form schema based on Prisma Lead model fields
const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  // Removed city, state, zipcode as they are no longer managed separately here
})

type ContactFormValues = z.infer<typeof contactFormSchema>

interface ContactFormProps {
  leadId: string
  initialData?: Partial<ContactFormValues>
  onSuccess?: (leadId: string, isNewLead?: boolean) => void
  onCancel?: () => void
  isReadOnly?: boolean
}

export function ContactForm({
  leadId,
  initialData = {},
  onSuccess,
  onCancel,
  isReadOnly = false
}: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [emailPrefix, setEmailPrefix] = useState<string>("")
  const [isDirty, setIsDirty] = useState(false); // Track if form is dirty
  const storageKey = `draft-lead-contact-${leadId}`;

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

  // --- Draft Loading ---
  useEffect(() => {
    if (!leadId || isReadOnly) return; // Don't load draft if no leadId or read-only

    const draft = sessionStorage.getItem(storageKey);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        reset(parsedDraft); // Load draft into the form
        setIsDirty(true); // Mark as dirty if a draft was loaded
        console.log("Loaded contact draft for lead:", leadId);
      } catch (e) {
        console.error("Failed to parse contact draft:", e);
        sessionStorage.removeItem(storageKey); // Clear invalid draft
        reset(initialData); // Fallback to initial data
        setIsDirty(false);
      }
    } else {
      reset(initialData); // No draft, ensure form has initial data
      setIsDirty(false);
    }
  }, [leadId, storageKey, reset, initialData, isReadOnly]); // Rerun if leadId or initialData changes


  // --- Draft Saving ---
  const watchedValues = watch(); // Watch all fields

  const saveDraft = useCallback(
    debounce((data: ContactFormValues) => {
      if (leadId && isDirty && !isReadOnly) { // Only save if dirty and not read-only
        console.log("Saving contact draft for lead:", leadId);
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      }
    }, 500), // Debounce time in ms
    [storageKey, leadId, isDirty, isReadOnly] // Dependencies for the debounced function
  );

  useEffect(() => {
    // Trigger saveDraft whenever watchedValues change (debounced)
    // Check if the watched values are different from initial data to set dirty flag
    const hasChanged = JSON.stringify(watchedValues) !== JSON.stringify(initialData);
    // We only set dirty to true, never false here based on comparison,
    // as it might override the dirty state set by loading a draft.
    if(hasChanged && !isDirty) {
       setIsDirty(true);
    }

    if (isDirty) { // Only save if the form is considered dirty
      saveDraft(watchedValues);
    }

    // Cleanup function for debounce
    return () => {
      saveDraft.cancel();
    };
  }, [watchedValues, saveDraft, isDirty, initialData]);


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
      // Removed the logic for parsing address into city/state/zip
      // The full address string will be sent directly to the API

      // Call API route to update lead contact information
      const response = await fetch(`/api/leads/${leadId}/contact`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data) // Sends { firstName, lastName, email, phone, address }
      })

      if (!response.ok) {
        let errorMessage = "Failed to update contact information";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response as JSON, use the status text
          errorMessage = `Error: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuccessMessage(result.message || "Contact information updated successfully");
      sessionStorage.removeItem(storageKey); // Clear draft on successful save
      setIsDirty(false); // Reset dirty state
      reset(data); // Update form state to reflect saved data
      onSuccess?.(result.lead?.id || leadId, leadId.startsWith('temp-'));
    } catch (err) {
      console.error("Error saving contact:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  // --- Discard Draft ---
  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard unsaved changes?")) {
      sessionStorage.removeItem(storageKey); // Clear draft
      reset(initialData); // Reset form to original data
      setIsDirty(false); // Reset dirty state
      console.log("Discarded contact draft for lead:", leadId);
    }
  };

  const emailDomainButtonStyle = {
    backgroundColor: "transparent",
    color: "#ffffff",
    border: "none",
    height: "100%",
    padding: "0 8px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  };

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
              className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50 w-full pr-20"
            />
            <div className="absolute right-0 top-0 h-full flex items-center">
              <button
                type="button"
                onClick={() => completeEmailWithDomain('@gmail.com')}
                disabled={isLoading || isReadOnly}
                style={emailDomainButtonStyle}
                className="hover:bg-white/10 rounded-sm"
                title="Add Gmail"
              >
                <img src="https://cdn-icons-png.flaticon.com/512/281/281769.png" alt="Gmail" className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => completeEmailWithDomain('@yahoo.com')}
                disabled={isLoading || isReadOnly}
                style={emailDomainButtonStyle}
                className="hover:bg-white/10 rounded-sm"
                title="Add Yahoo"
              >
                <img src="https://cdn-icons-png.flaticon.com/512/281/281773.png" alt="Yahoo" className="w-5 h-5" />
              </button>
            </div>
          </div>
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
        <Label htmlFor="address" className="text-white text-opacity-90">
          Address
        </Label>
        <Input
          id="address"
          placeholder="Full address"
          {...register("address")}
          disabled={isLoading || isReadOnly}
          className="bg-white bg-opacity-10 border-0 text-white placeholder:text-white placeholder:text-opacity-50"
        />
      </div>

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
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={isLoading || !isDirty} // Disable if not dirty
            className="flex-grow bg-lime-600 hover:bg-lime-700 text-black"
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
          {isDirty && ( // Show discard button only if dirty
            <Button
              type="button"
              variant="destructive"
              onClick={handleDiscard}
              disabled={isLoading}
              className="flex-shrink-0"
              aria-label="Discard changes"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </form>
  )
} 