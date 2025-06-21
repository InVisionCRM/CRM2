import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GmailService } from "@/lib/services/gmail";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { to, subject, text, cc } = body;
  if (!to || !subject || !text) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const gmail = new GmailService({
    accessToken: session.accessToken as string,
    refreshToken: session.refreshToken as string | undefined,
  });

  try {
    const resp = await gmail.sendEmail({ to, subject, body: text, cc });
    return NextResponse.json({ success: true, data: resp });
  } catch (e: any) {
    console.error("Gmail sendEmail error:", e);
    return NextResponse.json({ error: e.message || "Failed to send email" }, { status: 500 });
  }
} 