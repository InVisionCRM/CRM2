import { prisma } from "@/lib/db/prisma"
import { UserRole } from "@prisma/client"

export interface DeletionRequest {
  id: string
  leadId: string
  leadName: string
  leadEmail: string
  leadAddress: string
  leadStatus: string
  requestedBy: {
    id: string
    name: string
    email: string
  }
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  approvedBy?: {
    id: string
    name: string
    email: string
  }
  approvedAt?: Date
  rejectionReason?: string
}

/**
 * Create a deletion request
 */
export async function createDeletionRequest(
  leadId: string,
  leadData: {
    leadName: string
    leadEmail: string
    leadAddress: string
    leadStatus: string
    requestedBy: {
      id: string
      name: string
      email: string
    }
    reason?: string
  }
): Promise<DeletionRequest> {
  const request = await prisma.deletionRequest.create({
    data: {
      id: crypto.randomUUID(),
      leadId,
      leadName: leadData.leadName,
      leadEmail: leadData.leadEmail,
      leadAddress: leadData.leadAddress,
      leadStatus: leadData.leadStatus,
      requestedById: leadData.requestedBy.id,
      requestedByName: leadData.requestedBy.name,
      requestedByEmail: leadData.requestedBy.email,
      reason: leadData.reason,
      status: 'pending',
      createdAt: new Date()
    }
  })

  return {
    id: request.id,
    leadId: request.leadId,
    leadName: request.leadName,
    leadEmail: request.leadEmail,
    leadAddress: request.leadAddress,
    leadStatus: request.leadStatus,
    requestedBy: {
      id: request.requestedById,
      name: request.requestedByName,
      email: request.requestedByEmail
    },
    reason: request.reason || undefined,
    status: request.status as 'pending' | 'approved' | 'rejected',
    createdAt: request.createdAt,
    approvedBy: request.approvedById ? {
      id: request.approvedById,
      name: request.approvedByName!,
      email: request.approvedByEmail!
    } : undefined,
    approvedAt: request.approvedAt || undefined,
    rejectionReason: request.rejectionReason || undefined
  }
}

/**
 * Get all pending deletion requests
 */
export async function getPendingDeletionRequests(): Promise<DeletionRequest[]> {
  const requests = await prisma.deletionRequest.findMany({
    where: {
      status: 'pending'
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return requests.map(request => ({
    id: request.id,
    leadId: request.leadId,
    leadName: request.leadName,
    leadEmail: request.leadEmail,
    leadAddress: request.leadAddress,
    leadStatus: request.leadStatus,
    requestedBy: {
      id: request.requestedById,
      name: request.requestedByName,
      email: request.requestedByEmail
    },
    reason: request.reason || undefined,
    status: request.status as 'pending' | 'approved' | 'rejected',
    createdAt: request.createdAt,
    approvedBy: request.approvedById ? {
      id: request.approvedById,
      name: request.approvedByName!,
      email: request.approvedByEmail!
    } : undefined,
    approvedAt: request.approvedAt || undefined,
    rejectionReason: request.rejectionReason || undefined
  }))
}

/**
 * Approve a deletion request
 */
export async function approveDeletionRequest(
  requestId: string,
  approvedBy: {
    id: string
    name: string
    email: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const request = await prisma.deletionRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return { success: false, error: "Deletion request not found" }
    }

    if (request.status !== 'pending') {
      return { success: false, error: "Request is not pending" }
    }

    // Update the request status
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        approvedById: approvedBy.id,
        approvedByName: approvedBy.name,
        approvedByEmail: approvedBy.email,
        approvedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error approving deletion request:", error)
    return { success: false, error: "Failed to approve request" }
  }
}

/**
 * Reject a deletion request
 */
export async function rejectDeletionRequest(
  requestId: string,
  rejectedBy: {
    id: string
    name: string
    email: string
  },
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const request = await prisma.deletionRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      return { success: false, error: "Deletion request not found" }
    }

    if (request.status !== 'pending') {
      return { success: false, error: "Request is not pending" }
    }

    // Update the request status
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        approvedById: rejectedBy.id,
        approvedByName: rejectedBy.name,
        approvedByEmail: rejectedBy.email,
        approvedAt: new Date(),
        rejectionReason
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error rejecting deletion request:", error)
    return { success: false, error: "Failed to reject request" }
  }
}

/**
 * Check if user can approve deletions
 */
export async function canApproveDeletions(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  return user?.role === UserRole.ADMIN
} 