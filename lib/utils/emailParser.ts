// Simple regex-based contact info extractor for Gmail messages
// NOTE: This is a best-effort approach and may produce false positives.

export interface ParsedContactInfo {
  emails: string[];
  phoneNumbers: string[];
  addresses: string[];
}

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g;
// Very naive street address pattern: number + words + street suffix
// e.g. "123 Main St" or "4567 Elm Avenue"
const ADDRESS_REGEX = /\d+\s+[\w\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard)\b.*$/gim;

export function parseContactInfoFromText(text: string): ParsedContactInfo {
  const emails = Array.from(new Set((text.match(EMAIL_REGEX) || []).map((e) => e.trim())));
  const phoneNumbers = Array.from(new Set((text.match(PHONE_REGEX) || []).map((p) => p.trim())));
  const addresses = Array.from(new Set((text.match(ADDRESS_REGEX) || []).map((a) => a.trim())));
  return { emails, phoneNumbers, addresses };
} 