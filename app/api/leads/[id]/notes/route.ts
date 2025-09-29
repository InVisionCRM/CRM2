import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createNoteActivity } from "@/lib/services/activities";
import { ActivityType } from "@prisma/client";
import { GmailService } from "@/lib/services/gmail";

// Helper function to extract @mentions from content
function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z\s]+(?:\s+[a-zA-Z]+)*)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    const mentionedName = match[1].trim();
    if (mentionedName) {
      mentions.push(mentionedName);
    }
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}

// Helper function to find users by mentioned names
async function findMentionedUsers(mentionedNames: string[]) {
  if (mentionedNames.length === 0) return [];
  
  const users = await prisma.user.findMany({
    where: {
      name: {
        in: mentionedNames,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  
  return users;
}

// Helper function to send @mention email notifications
async function sendMentionNotifications(
  mentionedUsers: Array<{id: string, name: string | null, email: string}>,
  senderName: string | null,
  leadInfo: {id: string, firstName: string | null, lastName: string | null},
  noteContent: string,
  session: any
) {
  if (mentionedUsers.length === 0 || !session?.accessToken) return;
  
  const gmail = new GmailService({
    accessToken: session.accessToken as string,
    refreshToken: session.refreshToken as string | undefined,
  });
  
  const leadName = `${leadInfo.firstName || ''} ${leadInfo.lastName || ''}`.trim() || 'Unknown Lead';
  const senderDisplayName = senderName || 'Someone';
  
  for (const user of mentionedUsers) {
    try {
      const subject = `You were mentioned in a note for ${leadName}`;
      const body = `Hi ${user.name || user.email},

${senderDisplayName} mentioned you in a note for lead "${leadName}":

"${noteContent}"

You can view this lead at: ${process.env.NEXTAUTH_URL}/leads/${leadInfo.id}

Best regards,
CRM Notification System`;

      await gmail.sendEmail({
        to: user.email,
        subject,
        body
      });
      
      console.log(`📧 Sent @mention notification to ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to send @mention notification to ${user.email}:`, error);
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { content } = await request.json();

    // Validate input
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Check if lead exists and get lead info for notifications
    const lead = await prisma.lead.findUnique({ 
      where: { id },
      select: { 
        id: true,
        firstName: true,
        lastName: true
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Add note activity
    const { success, activity, error } = await createNoteActivity({
      leadId: id,
      userId: session.user.id,
      note: content
    });

    if (!success) {
      return NextResponse.json(
        { error: error || "Failed to create note" },
        { status: 500 }
      );
    }

    // Extract @mentions and send notifications
    const mentionedNames = extractMentions(content);
    if (mentionedNames.length > 0) {
      console.log(`🔍 Found @mentions: ${mentionedNames.join(', ')}`);
      
      const mentionedUsers = await findMentionedUsers(mentionedNames);
      if (mentionedUsers.length > 0) {
        console.log(`👥 Sending notifications to: ${mentionedUsers.map(u => u.email).join(', ')}`);
        
        // Send notifications asynchronously (don't wait for completion)
        sendMentionNotifications(
          mentionedUsers,
          session.user.name,
          lead,
          content,
          session
        ).catch(error => {
          console.error('❌ Error sending @mention notifications:', error);
        });
      } else {
        console.log('⚠️ No users found for mentioned names:', mentionedNames);
      }
    }

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve notes as activities
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if lead exists
    const lead = await prisma.lead.findUnique({ 
      where: { id },
      select: { id: true }
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Fetch note activities for this lead
    const activities = await prisma.activity.findMany({
      where: { 
        leadId: id,
        type: ActivityType.NOTE_ADDED
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform activities to match ApiNote interface expected by frontend
    const notes = activities.map(activity => ({
      id: activity.id,
      content: activity.description || "", // The actual note content is stored in description
      createdAt: activity.createdAt.toISOString(),
      userId: activity.userId,
      leadId: activity.leadId || id,
      user: {
        name: activity.user?.name || null
      }
    }));

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
} 