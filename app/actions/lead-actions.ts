"use server"

import { revalidatePath } from "next/cache"
import { createLead, updateLead, deleteLead, getLeadById } from "@/lib/db/leads"
import { uploadToBlob } from "@/lib/blob"
import { createFile, deleteFile } from "@/lib/db/files"
import { prisma } from "@/lib/db/prisma"

export async function createLeadAction(
  data: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    address?: string
    streetAddress?: string
    city?: string
    state?: string
    zipcode?: string
    status: string
    assignedToId?: string
    notes?: string
  },
  files?: File[],
) {
  try {
    console.log("Creating lead with data:", data)

    // Create the lead
    const lead = await createLead({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      streetAddress: data.streetAddress || null,
      city: data.city || null,
      state: data.state || null,
      zipcode: data.zipcode || null,
      status: data.status || "SIGNED_CONTRACT",
      assignedToId: data.assignedToId || null,
      notes: data.notes || null,
      userId: "system" // Required for activity creation
    })

    console.log("Lead created successfully:", lead)

    // Upload files if any
    if (files && files.length > 0 && typeof uploadToBlob === "function") {
      console.log(`Uploading ${files.length} files for lead ${lead.id}`)

      const filePromises = files.map(async (file) => {
        try {
          const uploadedFile = await uploadToBlob(file, lead.id)
          console.log("File uploaded to blob:", uploadedFile)

          // Create file record in database
          await createFile({
            leadId: lead.id,
            url: uploadedFile.url,
            filename: uploadedFile.filename,
            filesize: uploadedFile.filesize,
          })
        } catch (error) {
          console.error("Error uploading file:", error)
        }
      })

      await Promise.all(filePromises)
      console.log("All files uploaded and associated with lead")
    }

    revalidatePath("/leads")
    revalidatePath("/dashboard")

    return {
      success: true,
      lead,
      message: "Lead created successfully",
    }
  } catch (error) {
    console.error("Error creating lead:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create lead",
    }
  }
}

export async function updateLeadAction(
  id: string,
  data: {
    firstName?: string
    lastName?: string
    email?: string | null
    phone?: string | null
    address?: string | null
    streetAddress?: string | null
    city?: string | null
    state?: string | null
    zipcode?: string | null
    status?: string
    assignedToId?: string | null
    notes?: string | null
  },
  files?: File[],
) {
  try {
    console.log("Updating lead with ID:", id)
    console.log("Update data:", data)

    // Update the lead
    const updatedLead = await updateLead(id, {
      ...data,
      userId: "system" // Required for activity creation
    })

    if (!updatedLead) {
      console.error(`Lead with ID ${id} not found for update`)
      return {
        success: false,
        message: "Lead not found",
      }
    }

    console.log("Lead updated successfully:", updatedLead)

    // Upload files if any
    if (files && files.length > 0 && typeof uploadToBlob === "function") {
      console.log(`Uploading ${files.length} files for lead ${id}`)

      const filePromises = files.map(async (file) => {
        try {
          const uploadedFile = await uploadToBlob(file, id)
          console.log("File uploaded to blob:", uploadedFile)

          // Create file record in database
          await createFile({
            leadId: id,
            url: uploadedFile.url,
            filename: uploadedFile.filename,
            filesize: uploadedFile.filesize,
          })
        } catch (error) {
          console.error("Error uploading file:", error)
        }
      })

      await Promise.all(filePromises)
      console.log("All files uploaded and associated with lead")
    }

    revalidatePath("/leads")
    revalidatePath(`/leads/${id}`)
    revalidatePath("/dashboard")

    return {
      success: true,
      lead: updatedLead,
      message: "Lead updated successfully",
    }
  } catch (error) {
    console.error("Error updating lead:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update lead",
    }
  }
}

export async function deleteLeadAction(id: string) {
  try {
    console.log("Deleting lead with ID:", id)

    const success = await deleteLead(id)

    if (!success) {
      console.error(`Failed to delete lead with ID ${id}`)
      return {
        success: false,
        message: "Failed to delete lead",
      }
    }

    revalidatePath("/leads")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Lead deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting lead:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete lead",
    }
  }
}

export async function updateLeadStatus(id: string, status: string) {
  try {
    console.log(`Updating status for lead ${id} to ${status}`)

    // Update the lead with just the status
    const updatedLead = await updateLead(id, { 
      status,
      userId: "system" // Required for activity creation
    })

    if (!updatedLead) {
      console.error(`Lead with ID ${id} not found for status update`)
      return {
        success: false,
        message: "Lead not found",
      }
    }

    console.log("Lead status updated successfully")

    revalidatePath(`/leads/${id}`)
    revalidatePath("/leads")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Lead status updated successfully",
    }
  } catch (error) {
    console.error("Error updating lead status:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update lead status",
    }
  }
}

// Add the missing functions that are imported in other components

type InsuranceInfo = {
  company: string
  policyNumber: string
  phone: string
  secondaryPhone?: string | null
  adjusterName: string
  adjusterPhone: string
  adjusterEmail: string
  deductible: string
}

export async function updateInsuranceInfoAction(
  id: string,
  data: InsuranceInfo,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("Updating insurance info for lead:", id)

    // First, check if the lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!existingLead) {
      console.error(`Lead with ID ${id} not found for update`)
      return {
        success: false,
        message: "Lead not found",
      }
    }

    // Update the lead with insurance information using Prisma
    await prisma.lead.update({
      where: { id },
      data: {
        insuranceCompany: data.company || null,
        insurancePolicyNumber: data.policyNumber || null,
        insurancePhone: data.phone || null,
        insuranceSecondaryPhone: data.secondaryPhone || null,
        insuranceAdjusterName: data.adjusterName || null,
        insuranceAdjusterPhone: data.adjusterPhone || null,
        insuranceAdjusterEmail: data.adjusterEmail || null,
        insuranceDeductible: data.deductible || null,
        updatedAt: new Date(),
      },
    })

    console.log("Insurance information updated successfully")

    revalidatePath(`/leads/${id}`)

    return {
      success: true,
      message: "Insurance information updated successfully",
    }
  } catch (error) {
    console.error("Error updating insurance information:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update insurance information",
    }
  }
}

type AdjusterAppointmentData = {
  leadId: string
  appointmentDate: Date | null
  appointmentTime: string | null
  appointmentNotes?: string | null
}

export async function scheduleAdjusterAppointmentAction(
  data: AdjusterAppointmentData,
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("Scheduling adjuster appointment:", data)

    // First, check if the lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id: data.leadId },
    })

    if (!existingLead) {
      console.error(`Lead with ID ${data.leadId} not found`)
      return {
        success: false,
        message: "Lead not found",
      }
    }

    // Update the lead with appointment information using Prisma
    await prisma.lead.update({
      where: { id: data.leadId },
      data: {
        adjusterAppointmentDate: data.appointmentDate,
        adjusterAppointmentTime: data.appointmentTime,
        adjusterAppointmentNotes: data.appointmentNotes,
        updatedAt: new Date(),
      },
    })

    console.log("Appointment scheduled successfully")

    revalidatePath(`/leads/${data.leadId}`)
    revalidatePath("/calendar")

    return {
      success: true,
      message: data.appointmentDate
        ? "Adjuster appointment scheduled successfully"
        : "Adjuster appointment cancelled successfully",
    }
  } catch (error) {
    console.error("Error scheduling adjuster appointment:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to schedule adjuster appointment",
    }
  }
}

export async function deletePhotoAction(fileId: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Deleting photo with ID: ${fileId}`)

    // Get the file details and delete it
    const file = await deleteFile(fileId)

    if (!file) {
      console.error(`File with ID ${fileId} not found`)
      return {
        success: false,
        message: "File not found",
      }
    }

    console.log(`File ${fileId} deleted successfully from database`)

    // Note: We're not deleting the actual file from Vercel Blob storage
    // as that would require additional permissions and complexity
    // The file will remain in storage but won't be referenced in the database

    // Revalidate the lead page to show updated files
    revalidatePath(`/leads/${file.leadId}`)

    return {
      success: true,
      message: "Photo deleted successfully",
    }
  } catch (error) {
    console.error("Error deleting photo:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete photo",
    }
  }
}
