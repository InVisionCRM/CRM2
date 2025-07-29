import { prisma } from "@/lib/db/prisma"
import { GoogleChatService } from "./googleChat"
import { UserRole } from "@prisma/client"

export interface LeadChatData {
  leadId: string
  leadName: string
  leadEmail?: string
  leadAddress?: string
  leadStatus: string
  leadClaimNumber?: string
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
  session: any
): Promise<{ success: boolean; spaceId?: string; error?: string }> {
  try {
    // Initialize Google Chat service with OAuth
    const googleChat = new GoogleChatService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessToken: session.accessToken as string,
      refreshToken: session.refreshToken as string | undefined,
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

    // Create chat space with claim number - ALWAYS use claim number if available
    const claimNumber = leadData.leadClaimNumber
    if (!claimNumber) {
      return { 
        success: false, 
        error: "Cannot create chat space: Claim number is required" 
      }
    }
    
    const spaceName = `Lead: ${leadData.leadName} - Claim#${claimNumber} - ${leadData.leadId}`
    
    const spaceDescription = `🏠 **Lead Chat Space**

**Lead:** ${leadData.leadName}
**Claim #:** ${claimNumber}
**Status:** ${leadData.leadStatus}
**Email:** ${leadData.leadEmail || 'Not provided'}
**Address:** ${leadData.leadAddress || 'Not provided'}

**Quick Links:**
• 📊 [View in CRM](${process.env.NEXTAUTH_URL}/leads/${leadData.leadId})
• 📍 [Street View](${leadData.leadAddress ? `https://maps.google.com/?q=${encodeURIComponent(leadData.leadAddress)}&t=k` : ''})
• 📅 [Google Calendar](https://calendar.google.com)

**Available Commands:**
• /status - Check lead status
• /files - List lead files
• /photos - View lead photos
• /contracts - Check contracts
• /update [status] - Update status
• /upload - Get upload instructions
• /help - Show all commands`

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
      const welcomeMessage = `🎉 **Chat Space Created!**

**Lead:** ${leadData.leadName}
**Claim #:** ${claimNumber}
**Status:** ${leadData.leadStatus}

**Quick Links:**
• 📊 [View in CRM](${process.env.NEXTAUTH_URL}/leads/${leadData.leadId})
• 📍 [Street View](${leadData.leadAddress ? `https://maps.google.com/?q=${encodeURIComponent(leadData.leadAddress)}&t=k` : ''})
• 📅 [Google Calendar](https://calendar.google.com)

**Type /help to see available commands!**`

      await googleChat.sendMessage(result.spaceId, {
        text: welcomeMessage
      })

      // Send Street View image if address is available
      if (leadData.leadAddress) {
        try {
          const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodeURIComponent(leadData.leadAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          
          await googleChat.sendMessage(result.spaceId, {
            text: `📍 **Street View for ${leadData.leadName}**
            
${streetViewUrl}

**Address:** ${leadData.leadAddress}`
          })
        } catch (streetViewError) {
          console.error('Failed to send Street View:', streetViewError)
        }
      }

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
  session: any
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

    // Initialize Google Chat service with OAuth
    const googleChat = new GoogleChatService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessToken: session.accessToken as string,
      refreshToken: session.refreshToken as string | undefined,
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
  session: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        googleChatSpaceId: true,
        firstName: true,
        lastName: true,
        claimNumber: true,
        address: true
      }
    })

    if (!lead?.googleChatSpaceId) {
      return { success: false, error: "No chat space found for this lead" }
    }

    const googleChat = new GoogleChatService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessToken: session.accessToken as string,
      refreshToken: session.refreshToken as string | undefined,
    })

    const claimInfo = lead.claimNumber ? ` (Claim #${lead.claimNumber})` : ''
    const statusMessage = `🔄 **Status Updated**

**Lead:** ${lead.firstName || ''} ${lead.lastName || ''}${claimInfo}
**Old Status:** ${oldStatus}
**New Status:** ${newStatus}
**Updated by:** ${updatedBy.name}
**Updated at:** ${new Date().toLocaleString()}

**Quick Links:**
• 📊 [View in CRM](${process.env.NEXTAUTH_URL}/leads/${leadId})
• 📍 [Street View](${lead.address ? `https://maps.google.com/?q=${encodeURIComponent(lead.address)}&t=k` : ''})
• 📅 [Google Calendar](https://calendar.google.com)

**Available Commands:**
• /status - Check current status
• /files - List uploaded documents
• /photos - View lead photos
• /contracts - Check contract status
• /upload - Get upload instructions`

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
export async function getLeadChatSpace(leadId: string, session: any): Promise<{ success: boolean; space?: any; error?: string }> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { googleChatSpaceId: true }
    })

    if (!lead?.googleChatSpaceId) {
      return { success: false, error: "No chat space found for this lead" }
    }

    const googleChat = new GoogleChatService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      accessToken: session.accessToken as string,
      refreshToken: session.refreshToken as string | undefined,
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