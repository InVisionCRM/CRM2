export interface GmailCredentials {
  accessToken: string;
  refreshToken?: string | null;
}

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface GmailMessageMetadata {
  id: string;
  threadId: string;
  snippet: string;
  internalDate?: string;
  payloadHeaders?: Record<string, string>;
  labelIds?: string[];
}

export interface ParsedContactInfo {
  emails: string[];
  phoneNumbers: string[];
  addresses: string[];
}

export class GmailService {
  private credentials: GmailCredentials;
  private isRefreshingToken = false;
  private retryCount = 0;

  constructor(credentials: GmailCredentials) {
    this.credentials = credentials;
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.credentials.refreshToken) return null;

    this.isRefreshingToken = true;
    try {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: this.credentials.refreshToken,
        grant_type: "refresh_token",
      });
      const res = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access_token) {
        this.credentials.accessToken = data.access_token;
        this.retryCount = 0;
        return data.access_token as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      this.isRefreshingToken = false;
    }
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<any> {
    if (this.isRefreshingToken && !isRetry) {
      await new Promise((resolve) => {
        const int = setInterval(() => {
          if (!this.isRefreshingToken) {
            clearInterval(int);
            resolve(null);
          }
        }, 100);
      });
    }

    const res = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers as Record<string, string>),
        Authorization: `Bearer ${this.credentials.accessToken}`,
      },
    });

    if (!res.ok) {
      if ((res.status === 401 || res.status === 403) && !isRetry && this.retryCount < 1) {
        this.retryCount++;
        const newAccess = await this.refreshAccessToken();
        if (newAccess) return this.fetchWithAuth(endpoint, options, true);
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gmail API error (${res.status})`);
    }

    this.retryCount = 0;
    if (res.status === 204) return {};
    return res.json();
  }

  // List latest messages, returns metadata only (IDs, snippet, headers we request)
  async listMessages(maxResults = 20, q?: string, pageToken?: string): Promise<{ messages: GmailMessageMetadata[]; nextPageToken?: string }> {
    const params = new URLSearchParams({
      maxResults: String(maxResults),
      labelIds: 'INBOX',
    });
    if (q) params.set('q', q);
    if (pageToken) params.set('pageToken', pageToken);

    const listResp = await this.fetchWithAuth(`/messages?${params.toString()}`);

    const messageMetas: GmailMessageMetadata[] = [];

    if (!listResp.messages) {
      return { messages: messageMetas, nextPageToken: listResp.nextPageToken };
    }

    // Fetch metadata for each message ID
    const details = await Promise.all(
      (listResp.messages as { id: string; threadId: string }[]).map(async ({ id, threadId }) => {
        const detail = await this.fetchWithAuth(
          `/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`
        );
        const headersArr: Record<string, string> = {};
        (detail.payload?.headers || []).forEach((h: { name: string; value: string }) => {
          headersArr[h.name] = h.value;
        });
        return {
          id,
          threadId,
          snippet: detail.snippet,
          internalDate: detail.internalDate,
          payloadHeaders: headersArr,
          labelIds: detail.labelIds as string[] | undefined,
        } as GmailMessageMetadata;
      })
    );

    return { messages: details, nextPageToken: listResp.nextPageToken };
  }

  // Get full message
  async getMessage(id: string): Promise<any> {
    return this.fetchWithAuth(`/messages/${id}?format=full`);
  }

  // Send email
  async sendEmail({ to, subject, body, cc }: { to: string; subject: string; body: string; cc?: string }): Promise<any> {
    const emailLines = [
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      "Content-Type: text/plain; charset=UTF-8",
      "MIME-Version: 1.0",
      `Subject: ${subject}`,
      "",
      body,
    ];

    const email = emailLines.join("\n");
    const encodedMessage = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const resp = await this.fetchWithAuth(`/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encodedMessage }),
    });
    return resp;
  }
} 