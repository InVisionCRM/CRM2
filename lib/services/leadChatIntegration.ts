import { prisma } from "@/lib/db/prisma"
import { GoogleChatService } from "./googleChat"
import { UserRole } from "@prisma/client"

export interface LeadChatData {
  leadId: string
  leadName: string
  leadEmail?: string
  leadAddress?: string
  leadStatus: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
}

/**
 * Get all admin users from the database
 */
async function getAdminUsers() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return adminUsers
  } catch (error) {
    console.error("Error fetching admin users:", error)
    throw new Error("Failed to fetch admin users")
  }
}

/**
 * Create a Google Chat space for a lead
 */
export async function createLeadChatSpace(
  leadData: LeadChatData,
  session?: any
): Promise<{ success: boolean; spaceId?: string; error?: string }> {
  try {
    // Initialize Google Chat service with service account
    const googleChat = new GoogleChatService({
      serviceAccountEmail: process.env.GOOGLE_SA_EMAIL!,
      serviceAccountPrivateKey: process.env.GOOGLE_SA_PRIVATE_KEY!,
    })

    // Get all admin users
    const adminUsers = await getAdminUsers()
    
    // Prepare member list
    const members: string[] = []
    
    // Add all admins
    adminUsers.forEach(admin => {
      if (admin.email) {
        members.push(admin.email)
      }
    })
    
    // Add the lead creator
    if (leadData.createdBy.email) {
      members.push(leadData.createdBy.email)
    }
    
    // Add the assigned user if different from creator
    if (leadData.assignedTo && leadData.assignedTo.email && 
        leadData.assignedTo.email !== leadData.createdBy.email) {
      members.push(leadData.assignedTo.email)
    }

    // Create chat space
    const spaceName = `Lead: ${leadData.leadName} - ${leadData.leadId}`
    const spaceDescription = `Chat room for lead: ${leadData.leadName}
    
Lead Details:
- Email: ${leadData.leadEmail || 'Not provided'}
- Address: ${leadData.leadAddress || 'Not provided'}
- Status: ${leadData.leadStatus}
- Created by: ${leadData.createdBy.name}
${leadData.assignedTo ? `- Assigned to: ${leadData.assignedTo.name}` : ''}

CRM Link: ${process.env.NEXTAUTH_URL}/leads/${leadData.leadId}`

    const result = await googleChat.createSpace({
      displayName: spaceName,
      description: spaceDescription,
      members
    })

    if (result.success && result.spaceId) {
      // Update the lead with the chat space ID
      await prisma.lead.update({
        where: { id: leadData.leadId },
        data: { googleChatSpaceId: result.spaceId }
      })

      // Send welcome message to the chat
      const welcomeMessage = `🎉 **New Lead Created!**

**Lead Details:**
- **Name:** ${leadData.leadName}
- **Email:** ${leadData.leadEmail || 'Not provided'}
- **Address:** ${leadData.leadAddress || 'Not provided'}
- **Status:** ${leadData.leadStatus}
- **Created by:** ${leadData.createdBy.name}
${leadData.assignedTo ? `- **Assigned to:** ${leadData.assignedTo.name}` : ''}

**Team Members Added:**
${members.map(email => `• ${email}`).join('\n')}

This chat room will be used for all communications related to this lead. You'll receive notifications for status changes, appointments, and other updates.

**Quick Actions:**
• View lead in CRM: ${process.env.NEXTAUTH_URL}/leads/${leadData.leadId}
• Update lead status
• Schedule appointments
• Add notes and activities`

      await googleChat.sendMessage(result.spaceId, {
        text: welcomeMessage
      })

      console.log(`✅ Created Google Chat space for lead ${leadData.leadId}: ${result.spaceId}`)
      return { success: true, spaceId: result.spaceId }
    } else {
      console.error(`❌ Failed to create Google Chat space for lead ${leadData.leadId}:`, result.error)
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error("Error creating lead chat space:", error)
    return {
      success: false,
      error: error.message || "Failed to create lead chat space"
    }
  }
}

/**
 * Send a message to a lead's chat space
 */
export async function sendLeadChatMessage(
  leadId: string,
  message: string,
  session?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the lead and its chat space ID
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        googleChatSpaceId: true,
        firstName: true,
        lastName: true
      }
    })

    if (!lead?.googleChatSpaceId) {
      return { success: false, error: "No chat space found for this lead" }
    }

    // Initialize Google Chat service with service account
    const googleChat = new GoogleChatService({
      serviceAccountEmail: process.env.GOOGLE_SA_EMAIL!,
      serviceAccountPrivateKey: process.env.GOOGLE_SA_PRIVATE_KEY!,
    })

    const result = await googleChat.sendMessage(lead.googleChatSpaceId, {
      text: message
    })

    if (result.success) {
      console.log(`✅ Sent message to chat space for lead ${leadId}`)
    } else {
      console.error(`❌ Failed to send message to chat space for lead ${leadId}:`, result.error)
    }

    return result
  } catch (error: any) {
    console.error("Error sending lead chat message:", error)
    return {
      success: false,
      error: error.message || "Failed to send chat message"
    }
  }
}

/**
 * Update lead chat space when lead status changes
 */
export async function updateLeadChatStatus(
  leadId: string,
  oldStatus: string,
  newStatus: string,
  updatedBy: { name: string; email: string },
  session?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        googleChatSpaceId: true,
        firstName: true,
        lastName: true
      }
    })

    if (!lead?.googleChatSpaceId) {
      return { success: false, error: "No chat space found for this lead" }
    }

    const googleChat = new GoogleChatService({
      serviceAccountEmail: process.env.GOOGLE_SA_EMAIL!,
      serviceAccountPrivateKey: process.env.GOOGLE_SA_PRIVATE_KEY!,
    })

    const statusMessage = `📊 **Lead Status Updated**

**Lead:** ${lead.firstName || ''} ${lead.lastName || ''}
**Status Changed:** ${oldStatus} → ${newStatus}
**Updated by:** ${updatedBy.name}
**Time:** ${new Date().toLocaleString()}`

    const result = await googleChat.sendMessage(lead.googleChatSpaceId, {
      text: statusMessage
    })

    return result
  } catch (error: any) {
    console.error("Error updating lead chat status:", error)
    return {
      success: false,
      error: error.message || "Failed to update lead chat status"
    }
  }
}

/**
 * Get lead chat space information
 */
export async function getLeadChatSpace(leadId: string, session?: any): Promise<{ success: boolean; space?: any; error?: string }> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { googleChatSpaceId: true }
    })

    if (!lead?.googleChatSpaceId) {
      return { success: false, error: "No chat space found for this lead" }
    }

    const googleChat = new GoogleChatService({
      serviceAccountEmail: process.env.GOOGLE_SA_EMAIL!,
      serviceAccountPrivateKey: process.env.GOOGLE_SA_PRIVATE_KEY!,
    })

    return await googleChat.getSpace(lead.googleChatSpaceId)
  } catch (error: any) {
    console.error("Error getting lead chat space:", error)
    return {
      success: false,
      error: error.message || "Failed to get lead chat space"
    }
  }
} 