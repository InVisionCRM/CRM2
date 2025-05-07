"use server"

import { revalidatePath } from "next/cache"
import { createLead, updateLead, deleteLead, getLeadById } from "@/lib/db/leads"
import { uploadToBlob } from "@/lib/blob"
import { createFile, deleteFile } from "@/lib/db/files"
import { prisma } from "@/lib/db/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { LeadStatus, ActivityType, type Lead } from "@prisma/client"
import { formatStatusLabel } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid'

export async function createLeadAction(
  data: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    address?: string
    status: string
    assignedToId?: string
    notes?: string
  },
  files?: File[],
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || "system";

  try {
    console.log("Creating lead with data:", data)
    const newLeadId = uuidv4()

    const lead = await prisma.lead.create({
      data: {
        id: newLeadId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        status: Object.values(LeadStatus).includes(data.status as LeadStatus) 
                ? data.status as LeadStatus 
                : LeadStatus.follow_ups,
        assignedToId: data.assignedToId || null,
        notes: data.notes || null,
        activities: {
            create: {
                type: ActivityType.LEAD_CREATED,
                title: `Lead created: ${data.firstName} ${data.lastName}`.trim(),
                userId: userId,
            }
        }
      }
    })

    console.log("Lead created successfully:", lead)

    if (files && files.length > 0 && typeof uploadToBlob === "function" && typeof createFile === "function") {
      console.log(`Uploading ${files.length} files for lead ${lead.id}`)

      const filePromises = files.map(async (file) => {
        try {
          // Assuming uploadToBlob is correctly defined elsewhere
          // const uploadedFile = await uploadToBlob(file, lead.id)
          // console.log("File uploaded to blob:", uploadedFile)
          // Assuming createFile is correctly defined elsewhere
          // await createFile({
          //   leadId: lead.id,
          //   url: uploadedFile.url,
          //   name: uploadedFile.filename, // Ensure these field names match your createFile expectations
          //   size: uploadedFile.size,
          //   type: file.type, // Or uploadedFile.type
          // })
          // For now, mock this part if uploadToBlob/createFile are not ready
          console.warn("File upload logic is present but dependencies (uploadToBlob, createFile) need verification.")
        } catch (error) {
          console.error("Error during file upload process for a file:", error)
        }
      })

      await Promise.all(filePromises)
      console.log("File upload processing finished for lead:", lead.id)
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
    let errorMessage = "Failed to create lead.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      success: false,
      message: errorMessage,
    }
  }
}

interface UpdateLeadActionData {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  status?: LeadStatus
  notes?: string | null
  assignedToId?: string | null
}

export async function updateLeadAction(
  id: string,
  data: UpdateLeadActionData
): Promise<{ success: boolean; error?: string; lead?: Lead }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  if (data.status && !Object.values(LeadStatus).includes(data.status)) {
    return { success: false, error: "Invalid status value provided." };
  }

  try {
    const leadToUpdate = await prisma.lead.findUnique({ where: { id } });
    if (!leadToUpdate) {
        return { success: false, error: "Lead not found." };
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        ...(data.status && data.status !== leadToUpdate.status && {
          activities: {
            create: {
              type: ActivityType.STATUS_CHANGED,
              title: `Status changed to ${formatStatusLabel(data.status)}`,
              userId: userId,
            },
          },
        }),
      },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/dashboard");

    return { success: true, lead: updatedLead };
  } catch (error) {
    console.error("Error in updateLeadAction:", error);
    return { success: false, error: "Failed to update lead." };
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

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<{ success: boolean; error?: string }> {
  if (!Object.values(LeadStatus).includes(status)) {
    return { success: false, error: "Invalid status value." };
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "User not authenticated. Cannot update lead status." };
  }

  try {
    const leadToUpdate = await prisma.lead.findUnique({ where: { id } });
    if (!leadToUpdate) {
        return { success: false, error: "Lead not found." };
    }
    
    if (leadToUpdate.status === status) {
        return { success: true };
    }

    await prisma.lead.update({
      where: { id },
      data: {
        status,
        activities: {
          create: {
            type: ActivityType.STATUS_CHANGED,
            title: `Status changed from ${formatStatusLabel(leadToUpdate.status)} to ${formatStatusLabel(status)}`,
            userId: userId,
          },
        },
      },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating lead status:", error);
    return { success: false, error: "Database error: Failed to update lead status." };
  }
}

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
