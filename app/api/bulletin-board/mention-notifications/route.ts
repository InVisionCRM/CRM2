import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GmailService } from "@/lib/services/gmail";

interface MentionedUser {
  id: string;
  name: string | null;
  email: string;
}

interface BulletinBoardMentionRequest {
  mentionedUsers: MentionedUser[];
  senderName: string | null;
  messageContent: string;
  category: string;
  messageId: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BulletinBoardMentionRequest = await request.json();
    const { mentionedUsers, senderName, messageContent, category, messageId } = body;

    if (!mentionedUsers || mentionedUsers.length === 0) {
      return NextResponse.json({ error: "No mentioned users" }, { status: 400 });
    }

    const gmail = new GmailService({
      accessToken: session.accessToken as string,
      refreshToken: session.refreshToken as string | undefined,
    });

    const senderDisplayName = senderName || 'Someone';
    const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);
    
    const bulletinBoardUrl = `${process.env.NEXTAUTH_URL}/dashboard?tab=bulletin`;

    for (const user of mentionedUsers) {
      try {
        const subject = `You were mentioned in a ${categoryDisplay} bulletin board message`;
        const body = `Hi ${user.name || user.email},

${senderDisplayName} mentioned you in a ${categoryDisplay} bulletin board message:

"${messageContent}"

You can view the bulletin board at: ${bulletinBoardUrl}

Best regards,
CRM Notification System`;

        await gmail.sendEmail({
          to: user.email,
          subject,
          body
        });
        
        console.log(`📧 Sent bulletin board @mention notification to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send bulletin board @mention notification to ${user.email}:`, error);
      }
    }

    return NextResponse.json({ success: true, message: "Notifications sent" });
  } catch (error) {
    console.error("Error sending bulletin board mention notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
} 