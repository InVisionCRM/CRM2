"use server"

import { revalidatePath } from "next/cache"
import { deleteLead } from "@/lib/db/leads"
import { uploadToBlob } from "@/lib/blob"
import { createFile, deleteFile } from "@/lib/db/files"
import { prisma } from "@/lib/db/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { LeadStatus, ActivityType, Prisma, type Lead } from "@prisma/client"
import { formatStatusLabel } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid'
import { GoogleDriveService } from "@/lib/services/googleDrive"
import { createStatusChangeActivity } from "@/lib/services/activities"
import { getCurrentUser } from "@/lib/session"
import { sendLeadDeletionNotification, sendDeletionRequestNotification } from "@/lib/services/admin-notifications"
import { createDeletionRequest } from "@/lib/services/deletion-approval"
import { createLeadChatSpace, updateLeadChatStatus } from "@/lib/services/leadChatIntegration"

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

    // ---- BEGIN Google Drive Folder Creation ----
    /*
    if (session?.accessToken && lead) {
      const parentFolderId = process.env.GOOGLE_DRIVE_LEADS_PARENT_FOLDER_ID;

      if (!parentFolderId) {
        console.warn("GOOGLE_DRIVE_LEADS_PARENT_FOLDER_ID is not set in .env. Skipping Google Drive folder creation for lead:", lead.id);
      } else {
        try {
          const driveService = new GoogleDriveService({ accessToken: session.accessToken as string });
          const folderName = `Lead: ${lead.firstName || 'N/A'} ${lead.lastName || 'N/A'} - ID ${lead.id}`.replace(/[\\/:"*?<>|]/g, '_'); // Sanitize name

          console.log(`Attempting to create Google Drive folder: "${folderName}" in parent "${parentFolderId}"`);
          const folderResult = await driveService.createFolder(folderName, { parentId: parentFolderId });

          if (folderResult.success && folderResult.data) {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { googleDriveFolderId: folderResult.data.id },
            });
            console.log(`Google Drive folder created and linked for lead ${lead.id}: Folder ID ${folderResult.data.id}`);
          } else {
            console.error(`Failed to create Google Drive folder for lead ${lead.id}. Error: ${folderResult.message}`);
          }
        } catch (driveError: any) {
          console.error(`Error during Google Drive folder creation process for lead ${lead.id}: `, driveError.message || driveError);
        }
      }
    } else if (!session?.accessToken) {
      console.warn("No Google access token found in session. Skipping Google Drive folder creation for lead:", lead?.id || 'new lead');
    }
    */
    // ---- END Google Drive Folder Creation ----

    // Placeholder for file uploads if files are provided.
    // The original 'files' handling pointed to a generic blob upload.
    // If these files should go into the newly created Drive folder, specific logic is needed here.
    /*
    if (files && files.length > 0 && lead && session?.accessToken) {
        const leadDriveFolderId = (await prisma.lead.findUnique({ where: { id: lead.id }, select: { googleDriveFolderId: true } }))?.googleDriveFolderId;
        if (leadDriveFolderId) {
            console.log(`Processing ${files.length} files for Drive folder ${leadDriveFolderId} of lead ${lead.id}`);
            const driveService = new GoogleDriveService({ accessToken: session.accessToken as string });
            for (const file of files) {
                try {
                    await driveService.uploadFile(file, { folderId: leadDriveFolderId });
                    console.log(`File ${file.name} uploaded to Drive for lead ${lead.id}`);
                } catch (uploadError: any) {
                    console.error(`Error uploading file ${file.name} to Drive for lead ${lead.id}:`, uploadError.message || uploadError);
                }
            }
        } else {
            console.warn(`Cannot upload files to Drive for lead ${lead.id}: Drive folder ID not found or not created.`);
        }
    }
    */

    // Note: Google Chat spaces are now created on-demand via the chat widget
    // Users can create chat spaces by clicking the "Create Chat Space" button in the lead detail page

    revalidatePath("/leads");
    revalidatePath("/dashboard")

    return {
      success: true,
      lead,
      message: "Lead created successfully",
    }
  } catch (error: any) {
    console.error("Error creating lead in action:", error);
    return {
      success: false,
      message: error.message || "Failed to create lead due to an unexpected error.",
      leadId: null,
      data: null,
    };
  }
}

interface UpdateLeadParams {
  status?: LeadStatus;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  assignedToId?: string;
  claimNumber?: string;
  insuranceCompany?: string;
  insurancePhone?: string;
  insuranceAdjusterName?: string;
  insuranceAdjusterPhone?: string;
  insuranceAdjusterEmail?: string;
  // Optional JSON metadata field. We'll merge with existing metadata when provided
  metadata?: Record<string, unknown>;
  // Add other fields as needed
}

export async function updateLeadAction(
  id: string,
  params: UpdateLeadParams
) {
  try {
    // Get existing lead to compare changes
    const existingLead = await prisma.lead.findUnique({
      where: { id },
      select: { status: true, metadata: true }
    });
    
    if (!existingLead) {
      return { success: false, error: "Lead not found" };
    }

    // Separate metadata from other fields so we can merge it safely
    const { metadata, ...rest } = params;

    // Build update payload
    const updateData: Prisma.LeadUpdateInput = {
      ...rest,
    } as Prisma.LeadUpdateInput;

    if (metadata !== undefined) {
      const existingMetadata = (existingLead.metadata ?? {}) as Record<string, unknown>;
      const mergedMetadata = { ...existingMetadata, ...metadata } as Prisma.InputJsonValue;
      updateData.metadata = mergedMetadata;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });
    
    // Create activity log if status was changed
    if (params.status && params.status !== existingLead.status) {
      const user = await getCurrentUser();
      await createStatusChangeActivity({
        leadId: id,
        userId: user?.id,
        oldStatus: existingLead.status,
        newStatus: params.status,
      });
    }

    // Revalidate paths to refresh data
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/dashboard");

    return { success: true, lead: updatedLead };
  } catch (error) {
    console.error("Error updating lead:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update lead" 
    };
  }
}

export async function deleteLeadAction(id: string, reason?: string) {
  try {
    console.log("Creating deletion request for lead with ID:", id)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return {
        success: false,
        message: "Unauthorized - Please log in to delete leads",
      }
    }

    // Get lead details first
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        address: true,
        status: true,
        createdAt: true
      }
    })

    if (!lead) {
      return {
        success: false,
        message: "Lead not found",
      }
    }

    // Create deletion request instead of immediately deleting
    const deletionRequest = await createDeletionRequest(id, {
      leadName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead',
      leadEmail: lead.email || '',
      leadAddress: lead.address || '',
      leadStatus: lead.status,
      requestedBy: {
        id: session.user.id,
        name: session.user.name || 'Unknown User',
        email: session.user.email || ''
      },
      reason
    })

    // Send notification to all admins about the deletion request
    if (session?.accessToken) {
      try {
        await sendDeletionRequestNotification({
          requestId: deletionRequest.id,
          leadId: deletionRequest.leadId,
          leadName: deletionRequest.leadName,
          leadEmail: deletionRequest.leadEmail,
          leadAddress: deletionRequest.leadAddress,
          requestedBy: {
            id: session.user.id,
            name: session.user.name || 'Unknown User',
            email: session.user.email || ''
          },
          reason: deletionRequest.reason,
          leadStatus: deletionRequest.leadStatus,
          createdAt: deletionRequest.createdAt.toISOString()
        }, session)
      } catch (notificationError) {
        console.error("Failed to send deletion request notification:", notificationError)
        // Don't fail the request creation if notification fails
      }
    }

    revalidatePath("/leads")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Deletion request created successfully. Waiting for admin approval.",
      requestId: deletionRequest.id
    }
  } catch (error) {
    console.error("Error creating deletion request:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create deletion request",
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

    const oldStatus = leadToUpdate.status
    
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

            // Update Google Chat with status change
        if (session?.accessToken) {
          try {
            await updateLeadChatStatus(
              id,
              formatStatusLabel(oldStatus),
              formatStatusLabel(status),
              {
                name: session.user.name || 'Unknown User',
                email: session.user.email || ''
              },
              session
            )
          } catch (chatError: any) {
            console.error(`Error updating Google Chat for lead ${id}:`, chatError.message || chatError)
            // Don't fail status update if chat update fails
          }
        }

    // ---------- AUTO-SCHEDULER ----------
    // Map certain status transitions to calendar event types
    const statusToEvent: Record<LeadStatus, { type: 'acv' | 'rcv' | 'build'; label: string } | undefined> = {
      [LeadStatus.acv]:   { type: 'acv',   label: 'Pick up ACV' },
      [LeadStatus.job]:   { type: 'build', label: 'Build Date' },
      [LeadStatus.zero_balance]: undefined,
      [LeadStatus.completed_jobs]: undefined,
      [LeadStatus.colors]: undefined,
      [LeadStatus.denied]: undefined,
      [LeadStatus.follow_ups]: undefined,
      [LeadStatus.scheduled]: { type: 'build', label: 'Build Date' },
      [LeadStatus.signed_contract]: undefined,
    } as const;

    const autoEvent = statusToEvent[status];

    if (autoEvent) {
      try {
        // Build payload similar to /api/calendar/create-event
        const leadInfo = await prisma.lead.findUnique({ where: { id } });
        if (leadInfo && session?.accessToken) {
          const body = {
            title: `${autoEvent.label} - ${leadInfo.firstName || ''} ${leadInfo.lastName || ''}`.trim(),
            description: `${autoEvent.label} scheduled automatically via status change.`,
            startDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days out
            endDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60*60*1000).toISOString(),
            leadId: leadInfo.id,
            leadName: `${leadInfo.firstName || ''} ${leadInfo.lastName || ''}`.trim(),
            eventType: autoEvent.type,
            location: leadInfo.address || '',
          };

          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/calendar/create-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: '' },
            body: JSON.stringify(body),
          });
        }
      } catch (err) {
        console.warn('Auto-scheduler: failed to create calendar event', err);
      }
    }

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
  appointmentDate: string | null
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

    // Parse the date string into a Date object if it exists
    const appointmentDate = data.appointmentDate ? new Date(data.appointmentDate) : null

    // Update the lead with appointment information using Prisma
    await prisma.lead.update({
      where: { id: data.leadId },
      data: {
        adjusterAppointmentDate: appointmentDate,
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

export async function updateLeadAssigneeAction(
  leadId: string,
  assignedToId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, message: "Unauthorized" };
    }

    // Get the current lead to check for changes
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { assignedToId: true, status: true }
    });

    if (!lead) {
      return { success: false, message: "Lead not found" };
    }

    // Update the lead in the database
    await prisma.lead.update({
      where: { id: leadId },
      data: { 
        assignedToId: assignedToId || null 
      },
    });

    // Create activity for the assignment change if it actually changed
    if (lead.assignedToId !== assignedToId) {
      const previousAssignee = lead.assignedToId 
        ? await prisma.user.findUnique({ where: { id: lead.assignedToId }, select: { name: true } })
        : null;
      
      const newAssignee = assignedToId 
        ? await prisma.user.findUnique({ where: { id: assignedToId }, select: { name: true } })
        : null;

      await prisma.activity.create({
        data: {
          leadId: leadId,
          type: ActivityType.LEAD_UPDATED,
          title: `Assignee Changed`,
          description: `Lead assigned to ${newAssignee?.name || 'Unassigned'} (Previously: ${previousAssignee?.name || 'Unassigned'})`,
          userId: session.user.id,
        }
      });
    }

    // Revalidate paths to refresh data
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
    
    return { 
      success: true, 
      message: "Lead assignee updated successfully" 
    };
  } catch (error) {
    console.error("Error updating lead assignee:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to update lead assignee" 
    };
  }
}
