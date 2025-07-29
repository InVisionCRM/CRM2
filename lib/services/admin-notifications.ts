import { prisma } from "@/lib/db/prisma"
import { GmailService } from "./gmail"
import { UserRole } from "@prisma/client"

export interface LeadDeletionNotificationData {
  leadId: string
  leadName: string
  leadEmail: string
  leadAddress: string
  deletedBy: {
    id: string
    name: string
    email: string
  }
  deletionReason?: string
  leadStatus: string
  createdAt: string
}

/**
 * Get all admin users from the database
 */
export async function getAdminUsers() {
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
 * Send lead deletion notification to all admins
 */
export async function sendLeadDeletionNotification(
  leadData: LeadDeletionNotificationData,
  session: any
) {
  try {
    // Get all admin users
    const adminUsers = await getAdminUsers()
    
    if (adminUsers.length === 0) {
      console.log("No admin users found to notify")
      return
    }

    // Initialize Gmail service
    const gmail = new GmailService({
      accessToken: session.accessToken as string,
      refreshToken: session.refreshToken as string | undefined,
    })

    // Create email content
    const subject = `🚨 Lead Deletion Alert: ${leadData.leadName}`
    const body = createLeadDeletionEmailBody(leadData)

    // Send email to all admins
    const emailPromises = adminUsers.map(async (admin) => {
      try {
        await gmail.sendEmail({
          to: admin.email,
          subject,
          body
        })
        console.log(`📧 Lead deletion notification sent to ${admin.email}`)
      } catch (error) {
        console.error(`❌ Failed to send notification to ${admin.email}:`, error)
      }
    })

    // Wait for all emails to be sent
    await Promise.all(emailPromises)
    
    console.log(`✅ Lead deletion notifications sent to ${adminUsers.length} admin(s)`)
  } catch (error) {
    console.error("Error sending lead deletion notifications:", error)
    // Don't throw error to avoid breaking the deletion process
  }
}

/**
 * Create email body for lead deletion notification
 */
function createLeadDeletionEmailBody(data: LeadDeletionNotificationData): string {
  const leadName = data.leadName || "Unknown Lead"
  const leadEmail = data.leadEmail || "No email"
  const leadAddress = data.leadAddress || "No address"
  const deletionTime = new Date().toLocaleString()
  
  return `Hi Admin,

A lead has been deleted from the CRM system.

**Lead Details:**
- Name: ${leadName}
- Email: ${leadEmail}
- Address: ${leadAddress}
- Status: ${data.leadStatus}
- Created: ${data.createdAt}

**Deletion Details:**
- Deleted by: ${data.deletedBy.name} (${data.deletedBy.email})
- Deletion time: ${deletionTime}
${data.deletionReason ? `- Reason: ${data.deletionReason}` : ""}

**Action Required:**
Please review this deletion to ensure it was appropriate. If this was an error, you may need to restore the lead from backups or contact the user who performed the deletion.

**System Information:**
- Lead ID: ${data.leadId}
- Deleted by User ID: ${data.deletedBy.id}

This is an automated notification from the CRM system.

Best regards,
CRM Notification System`
} 