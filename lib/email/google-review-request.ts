/**
 * Email copy for “Google review + referral” outreach.
 */

export const DEFAULT_GOOGLE_REVIEW_URL = "https://share.google/zOiHlDyhzhskcWKoR";

export function getGoogleReviewUrl(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    process.env.GOOGLE_REVIEW_URL ||
    DEFAULT_GOOGLE_REVIEW_URL
  );
}

/** Safe origin only — used for client-supplied preview base. */
export function normalizeEmailAssetBaseUrl(raw: string): string | null {
  const t = raw?.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Base URL for /public assets embedded in outbound email HTML.
 * Prefer NEXT_PUBLIC_EMAIL_ASSET_BASE_URL when it differs from the app (e.g. stable production domain).
 * Preview calls should pass the browser origin override so iframe previews match the tab you’re on.
 */
export function resolveEmailImageBaseUrl(assetBaseUrlOverride?: string | null): string {
  const fromClient = normalizeEmailAssetBaseUrl(assetBaseUrlOverride ?? "");
  if (fromClient) return fromClient;

  const base =
    process.env.NEXT_PUBLIC_EMAIL_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  return base.replace(/\/$/, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstNameFromLead(firstName: string | null, fullName: string | null): string {
  const t = (firstName || "").trim();
  if (t) return t;
  const n = (fullName || "").trim();
  if (!n) return "";
  return n.split(/\s+/)[0] || "";
}

export function buildGoogleReviewEmailParts(opts: {
  firstName: string | null;
  leadDisplayName: string | null;
  reviewUrl: string;
  siteBaseUrl: string;
  senderName: string | null;
  /** Inline PNG so Gmail does not need to fetch /logo.png from your server */
  logoDataUri?: string | null;
}): { subject: string; text: string; html: string } {
  const greetingName = firstNameFromLead(opts.firstName, opts.leadDisplayName);
  const hi = greetingName ? `Hi ${greetingName},` : "Hi,";
  const sender = (opts.senderName || "the In-Vision Construction team").trim();
  const reviewUrl = opts.reviewUrl;
  const base = opts.siteBaseUrl.replace(/\/$/, "");
  const logoSrc = `${base}/logo.png`;
  const website = "https://in-visionconstruction.com";

  // ASCII-only subject: avoids mojibake in clients when the Subject header is not RFC 2047-encoded (legacy sends).
  // No lead name in subject (avoids "test, thank you..." from CRM placeholders).
  const subject = "Thank you - Quick Google review? | In-Vision Construction";

  const text = `${hi}

Thank you for choosing In-Vision Construction. If you were happy with our work, we would truly appreciate a brief Google review — it helps other homeowners find us:
${reviewUrl}

If your experience was great and you know someone who could use our help, we would be grateful for a referral anytime.

Warm regards,
${sender}
In-Vision Construction
${website}
`;

  const safeHi = escapeHtml(hi);
  const safeSender = escapeHtml(sender);
  const logoImgSrc = opts.logoDataUri?.trim()
    ? opts.logoDataUri.trim()
    : escapeHtml(logoSrc);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>In-Vision Construction</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:22px 28px 18px;text-align:center;background:#1a1a1a;">
              <img src="${logoImgSrc}" alt="In-Vision Construction" width="96" style="display:block;margin:0 auto 10px;max-width:96px;height:auto;border:0;" />
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.02em;line-height:1.2;">In-Vision Construction</div>
              <div style="font-family:system-ui,-apple-system,sans-serif;font-size:11px;color:#a1a1aa;margin-top:6px;text-transform:uppercase;letter-spacing:0.14em;">Thank you for your business</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;font-size:17px;line-height:1.6;color:#27272a;">
              <p style="margin:0 0 16px;">${safeHi}</p>
              <p style="margin:0 0 16px;">Thank you for trusting <strong>In-Vision Construction</strong> with your project. If you were pleased with our work, a short Google review means a great deal to our small team.</p>
              <p style="margin:0 0 24px;text-align:center;">
                <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background-color:#1a73e8;color:#ffffff;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;font-size:15px;font-weight:600;padding:14px 28px;border-radius:999px;">Share your experience on Google</a>
              </p>
              <p style="margin:0 0 16px;">If everything went well and you know a friend or neighbor who could use our help, referrals are the highest compliment — we would love an introduction anytime.</p>
              <p style="margin:24px 0 8px;color:#52525b;font-size:15px;">Warm regards,<br /><strong>${safeSender}</strong><br />In-Vision Construction</p>
              <p style="margin:0;font-size:14px;"><a href="${website}" style="color:#2563eb;text-decoration:none;">${website}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.5;color:#a1a1aa;text-align:center;font-family:system-ui,-apple-system,sans-serif;">
              You received this message because you are a customer of In-Vision Construction.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
