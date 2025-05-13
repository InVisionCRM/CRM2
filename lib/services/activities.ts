import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

interface CreateActivityParams {
  leadId: string;
  type: ActivityType;
  title: string;
  description?: string;
  userId?: string;
  status?: string | null;
}

/**
 * Creates a new activity record for a lead
 */
export async function createActivity({
  leadId,
  type,
  title,
  description,
  userId,
  status = null
}: CreateActivityParams) {
  try {
    const activity = await prisma.activity.create({
      data: {
        leadId,
        type,
        title,
        description,
        userId: userId || 'system', // Default to system if no user provided
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return { success: true, activity };
  } catch (error) {
    console.error("Error creating activity:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create activity" 
    };
  }
}

/**
 * Creates a status change activity
 */
export async function createStatusChangeActivity({
  leadId,
  userId,
  oldStatus,
  newStatus
}: {
  leadId: string;
  userId?: string;
  oldStatus: string | null;
  newStatus: string;
}) {
  const formattedOldStatus = oldStatus ? oldStatus.replace(/_/g, ' ') : 'none';
  const formattedNewStatus = newStatus.replace(/_/g, ' ');
  
  return createActivity({
    leadId,
    type: ActivityType.STATUS_CHANGED,
    title: `Status changed to ${formattedNewStatus}`,
    description: `Lead status changed from ${formattedOldStatus} to ${formattedNewStatus}`,
    userId,
    status: newStatus
  });
}

/**
 * Creates a note activity
 */
export async function createNoteActivity({
  leadId,
  userId,
  note
}: {
  leadId: string;
  userId: string;
  note: string;
}) {
  return createActivity({
    leadId,
    type: ActivityType.NOTE_ADDED,
    title: `Note added`,
    description: note,
    userId
  });
} 