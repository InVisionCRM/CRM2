import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GmailService } from "@/lib/services/gmail";
import { parseContactInfoFromText } from "@/lib/utils/emailParser";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const gmail = new GmailService({
    accessToken: session.accessToken as string,
    refreshToken: session.refreshToken as string | undefined,
  });

  try {
    const message = await gmail.getMessage(id);

    // Extract plain text body
    let bodyText = "";
    const parts = message.payload?.parts || [];
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        const decoded = Buffer.from(part.body.data, "base64").toString("utf-8");
        bodyText += decoded;
      }
    }

    const parsed = parseContactInfoFromText(bodyText);

    return NextResponse.json({ success: true, message, parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch message" }, { status: 500 });
  }
} 