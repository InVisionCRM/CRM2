import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GmailService } from "@/lib/services/gmail";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const maxResultsParam = searchParams.get("maxResults") || "20";
  const q = searchParams.get("q") || undefined;
  const pageToken = searchParams.get("pageToken") || undefined;
  const maxResults = parseInt(maxResultsParam, 10);

  const gmail = new GmailService({
    accessToken: session.accessToken as string,
    refreshToken: session.refreshToken as string | undefined,
  });

  try {
    const { messages, nextPageToken } = await gmail.listMessages(maxResults, q, pageToken);
    return NextResponse.json({ success: true, messages, nextPageToken });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch messages" }, { status: 500 });
  }
} 