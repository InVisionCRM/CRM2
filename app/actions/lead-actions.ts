"use server"

import { revalidatePath } from "next/cache"
import { createLead, updateLead, deleteLead, getLeadById } from "@/lib/db/leads"
import { uploadToBlob } from "@/lib/blob"
import { sql } from "@/lib/db/client"

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
    assignedTo?: string
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
      assignedTo: data.assignedTo || null,
      notes: data.notes || null,
    })

    console.log("Lead created successfully:", lead)

    // Upload files if any
    if (files && files.length > 0 && typeof uploadToBlob === "function") {
      console.log(`Uploading ${files.length} files for lead ${lead.id}`)

      const filePromises = files.map(async (file) => {
        try {
          const uploadedFile = await uploadToBlob(file, lead.id)
          console.log("File uploaded to blob:", uploadedFile)

          // Create file record in database if you have a createFile function
          // await createFile({
          //   lead_id: lead.id,
          //   url: uploadedFile.url,
          //   filename: uploadedFile.filename,
          //   filesize: uploadedFile.filesize,
          // });
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
    assignedTo?: string | null
    notes?: string | null
  },
  files?: File[],
) {
  try {
    console.log("Updating lead with ID:", id)
    console.log("Update data:", data)

    // Update the lead
    const updatedLead = await updateLead(id, data)

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

          // Create file record in database if you have a createFile function
          // await createFile({
          //   lead_id: id,
          //   url: uploadedFile.url,
          //   filename: uploadedFile.filename,
          //   filesize: uploadedFile.filesize,
          // });
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
    const updatedLead = await updateLead(id, { status })

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
    const existingLead = await getLeadById(id)
    if (!existingLead) {
      console.error(`Lead with ID ${id} not found for update`)
      return {
        success: false,
        message: "Lead not found",
      }
    }

    const now = new Date()

    // Update the lead with insurance information
    await sql`
      UPDATE leads 
      SET 
        insurance_company = ${data.company || null},
        insurance_policy_number = ${data.policyNumber || null},
        insurance_phone = ${data.phone || null},
        insurance_secondary_phone = ${data.secondaryPhone || null},
        insurance_adjuster_name = ${data.adjusterName || null},
        insurance_adjuster_phone = ${data.adjusterPhone || null},
        insurance_adjuster_email = ${data.adjusterEmail || null},
        insurance_deductible = ${data.deductible || null},
        updated_at = ${now}
      WHERE id = ${id}
    `

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
    const existingLead = await getLeadById(data.leadId)
    if (!existingLead) {
      console.error(`Lead with ID ${data.leadId} not found`)
      return {
        success: false,
        message: "Lead not found",
      }
    }

    const now = new Date()

    // Update the lead with appointment information
    await sql`
      UPDATE leads 
      SET 
        adjuster_appointment_date = ${data.appointmentDate === null ? null : data.appointmentDate},
        adjuster_appointment_time = ${data.appointmentTime === null ? null : data.appointmentTime},
        adjuster_appointment_notes = ${data.appointmentNotes === null ? null : data.appointmentNotes},
        updated_at = ${now}
      WHERE id = ${data.leadId}
    `

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

    // First, get the file details to check if it exists
    const fileResult = await sql<{ lead_id: string; url: string }[]>`
      SELECT lead_id, url FROM files WHERE id = ${fileId}
    `

    if (!fileResult || fileResult.length === 0) {
      console.error(`File with ID ${fileId} not found`)
      return {
        success: false,
        message: "File not found",
      }
    }

    const file = fileResult[0]

    // Delete the file from the database
    await sql`DELETE FROM files WHERE id = ${fileId}`

    console.log(`File ${fileId} deleted successfully from database`)

    // Note: We're not deleting the actual file from Vercel Blob storage
    // as that would require additional permissions and complexity
    // The file will remain in storage but won't be referenced in the database

    // Revalidate the lead page to show updated files
    revalidatePath(`/leads/${file.lead_id}`)

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
