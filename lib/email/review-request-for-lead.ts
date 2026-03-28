import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import {
  buildGoogleReviewEmailParts,
  getGoogleReviewUrl,
  resolveEmailImageBaseUrl,
} from "@/lib/email/google-review-request";

async function loadLogoDataUriFromPublic(): Promise<string | null> {
  try {
    const p = path.join(process.cwd(), "public", "logo.png");
    const buf = await fs.readFile(p);
    if (buf.length < 68) return null;
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export type ReviewRequestForLeadResult =
  | { ok: true; to: string; subject: string; text: string; html: string }
  | { ok: false; error: string; status: number };

export async function getReviewRequestEmailForLead(
  leadId: string,
  senderName: string | null,
  options?: { assetBaseUrl?: string | null }
): Promise<ReviewRequestForLeadResult> {
  const trimmedId = leadId?.trim();
  if (!trimmedId) {
    return { ok: false, error: "leadId is required", status: 400 };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: trimmedId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!lead) {
    return { ok: false, error: "Lead not found", status: 404 };
  }

  if (!lead.email?.trim()) {
    return { ok: false, error: "Lead has no email address", status: 400 };
  }

  const leadDisplayName =
    [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || null;

  const siteBaseUrl = resolveEmailImageBaseUrl(options?.assetBaseUrl);
  const logoDataUri = await loadLogoDataUriFromPublic();

  const { subject, text, html } = buildGoogleReviewEmailParts({
    firstName: lead.firstName,
    leadDisplayName,
    reviewUrl: getGoogleReviewUrl(),
    siteBaseUrl,
    senderName,
    logoDataUri,
  });

  return {
    ok: true,
    to: lead.email.trim(),
    subject,
    text,
    html,
  };
}
