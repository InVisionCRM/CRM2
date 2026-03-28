import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GmailService } from "@/lib/services/gmail";
import { getReviewRequestEmailForLead } from "@/lib/email/review-request-for-lead";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { leadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const senderName =
    session.user?.name ??
    (typeof session.user?.email === "string" ? session.user.email.split("@")[0] : null);

  const built = await getReviewRequestEmailForLead(body.leadId ?? "", senderName);
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: built.status });
  }

  const { to, subject, text, html } = built;

  const gmail = new GmailService({
    accessToken: session.accessToken as string,
    refreshToken: session.refreshToken as string | undefined,
  });

  try {
    const resp = await gmail.sendEmail({
      to,
      subject,
      body: text,
      html,
    });
    return NextResponse.json({ success: true, data: resp });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send email";
    console.error("Gmail review-request error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
