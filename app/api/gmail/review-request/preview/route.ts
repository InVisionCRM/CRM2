import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReviewRequestEmailForLead } from "@/lib/email/review-request-for-lead";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { leadId?: string; assetBaseUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const senderName =
    session.user?.name ??
    (typeof session.user?.email === "string"
      ? session.user.email.split("@")[0]
      : null);

  const result = await getReviewRequestEmailForLead(body.leadId ?? "", senderName, {
    assetBaseUrl: body.assetBaseUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    to: result.to,
    subject: result.subject,
    text: result.text,
    html: result.html,
  });
}
