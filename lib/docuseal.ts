/**
 * Single source of truth for DocuSeal configuration and API access.
 *
 * Every DocuSeal call in this app goes through `docusealFetch`. Nothing else
 * should read DOCUSEAL_* environment variables directly.
 *
 * Two hosts, two jobs:
 *   DOCUSEAL_API_URL  — where the REST API lives.      Cloud: https://api.docuseal.com
 *   DOCUSEAL_APP_URL  — where signers open documents.  Cloud: https://docuseal.com
 *
 * On the old self-hosted instance both were the same origin and the API sat
 * under an extra `/api` prefix. On DocuSeal Cloud they are different hosts and
 * there is no `/api` prefix, which is why paths here are written as
 * `/submissions`, not `/api/submissions`. Set DOCUSEAL_API_URL to
 * `https://your-host:3000/api` if you ever move back to self-hosting.
 */

export type TemplateKind = 'generalContract' | 'thirdPartyAuth' | 'scopeOfWork'

const TEMPLATE_ENV_VAR: Record<TemplateKind, string> = {
  generalContract: 'DOCUSEAL_TEMPLATE_GENERAL_CONTRACT',
  thirdPartyAuth: 'DOCUSEAL_TEMPLATE_THIRD_PARTY_AUTH',
  scopeOfWork: 'DOCUSEAL_TEMPLATE_SCOPE_OF_WORK',
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function requireBaseUrl(name: string): string {
  return requireEnv(name).replace(/\/+$/, '')
}

/**
 * Numeric DocuSeal template ID for a contract type.
 * Throws if the variable is missing or not a positive integer, so a
 * misconfigured template fails loudly instead of silently sending the
 * wrong document to a client.
 */
export function templateId(kind: TemplateKind): number {
  const name = TEMPLATE_ENV_VAR[kind]
  const raw = requireEnv(name)
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${name} must be a positive integer, got: ${raw}`)
  }
  return id
}

/** Signer-facing URL for a submitter slug. */
export function signingUrl(slug: string): string {
  return `${requireBaseUrl('DOCUSEAL_APP_URL')}/s/${slug}`
}

/**
 * Call the DocuSeal REST API.
 * @param path API path beginning with a slash, e.g. `/submissions`.
 */
export async function docusealFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${requireBaseUrl('DOCUSEAL_API_URL')}${path}`

  return fetch(url, {
    ...init,
    headers: {
      'X-Auth-Token': requireEnv('DOCUSEAL_API_KEY'),
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

/**
 * Email the signer receives with a signature request.
 *
 * DocuSeal substitutes: {{template.name}}, {{submission.name}},
 * {{submitter.name}}, {{submitter.link}}, {{account.name}}.
 * Edit the copy here - it is the only place it is defined.
 */
export function signatureRequestMessage(): { subject: string; body: string } {
  return {
    subject: '{{template.name}} - ready for your signature',
    body: [
      'Hi {{submitter.name}},',
      '',
      'Thanks for choosing In-Vision Construction. Your {{template.name}} is ready to review and sign:',
      '',
      '{{submitter.link}}',
    ].join('\n'),
  }
}

/** What the UI needs to confirm a contract really went out. */
export interface SentConfirmation {
  sent: boolean
  sentAt: string | null
  submissionId: number
  templateName: string
  signingUrl: string
  client: { name: string; email: string; phone: string | null }
}

/**
 * Turn a freshly created submission into a confirmation the UI can trust.
 *
 * The POST response only proves DocuSeal accepted the request. Reading the
 * submission back gives `sent_at`, which is set once the signature-request
 * email has actually gone out - that is what `sent` reports.
 */
export async function confirmSubmission(
  created: unknown,
  phone: string | null,
): Promise<SentConfirmation> {
  const submissionId = Array.isArray(created)
    ? (created[0] as { submission_id?: number })?.submission_id
    : (created as { id?: number })?.id
  if (!submissionId) {
    throw new Error('DocuSeal returned no submission id')
  }

  // DocuSeal sets `sent_at` a beat after it accepts the send - measured at
  // 0.5-1.2s. Reading once immediately always saw null and reported a
  // successful send as "Queued", so wait for it rather than guess.
  const deadline = Date.now() + 8000
  let submission: any
  let submitter: any

  for (;;) {
    const res = await docusealFetch(`/submissions/${submissionId}`)
    if (!res.ok) {
      throw new Error(`Could not confirm submission ${submissionId}: ${res.status}`)
    }
    submission = await res.json()
    submitter = submission.submitters?.[0]
    if (!submitter) {
      throw new Error(`Submission ${submissionId} came back with no submitters`)
    }
    if (submitter.sent_at || Date.now() >= deadline) break
    await new Promise((r) => setTimeout(r, 500))
  }

  return {
    sent: Boolean(submitter.sent_at),
    sentAt: submitter.sent_at ?? null,
    submissionId,
    templateName: submission.template?.name ?? 'Contract',
    signingUrl: signingUrl(submitter.slug),
    client: {
      name: submitter.name ?? '',
      email: submitter.email ?? '',
      phone,
    },
  }
}
