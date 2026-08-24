import { ActivityType } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

/**
 * The one way to write an activity.
 *
 * The old log stored prose - "Insurance information updated for lead abc-123" -
 * which no UI can turn back into "Claim # changed from 4417-B to 4418-B".
 * Everything written through here carries structure instead, so the feed can
 * render a real diff and tell an addition apart from an edit.
 */

/** What happened, independent of which entity it happened to. */
export type ActivityVerb = 'CREATED' | 'UPDATED' | 'DELETED' | 'SENT' | 'SIGNED' | 'VIEWED'

export interface FieldChange {
  /** The machine field name, e.g. `claimNumber`. */
  field: string
  /** Human label for the feed, e.g. `Claim #`. */
  label: string
  from: string | null
  to: string | null
}

export interface ActivityMetadata {
  verb: ActivityVerb
  /** Which thing changed: `insurance`, `adjuster`, `contract`, `lead`, `file`. */
  entity: string
  /** Set when the actor is not a CRM user - a homeowner signing, for instance. */
  actorName?: string
  changes?: FieldChange[]
}

interface LogInput {
  type: ActivityType
  title: string
  leadId: string
  metadata: ActivityMetadata
  /** Omit for events caused by someone outside the CRM. */
  userId?: string | null
  description?: string
}

/**
 * Never throws. A failed audit write must not fail the operation being audited -
 * a contract that reached the client is still sent even if logging it did not.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        leadId: input.leadId,
        userId: input.userId ?? null,
        metadata: input.metadata as unknown as object,
      },
    })
  } catch (err) {
    console.error('⚠️ activity log write failed (operation itself was unaffected)', {
      type: input.type,
      leadId: input.leadId,
      error: err instanceof Error ? err.message : err,
    })
  }
}

/**
 * Compare two versions of a record and return only what actually changed.
 * Used so an edit logs its real diff rather than "something was updated".
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  labels: Record<string, string>,
): FieldChange[] {
  const changes: FieldChange[] = []

  for (const [field, label] of Object.entries(labels)) {
    if (!(field in after)) continue

    const from = normalise(before[field])
    const to = normalise(after[field])
    if (from === to) continue

    changes.push({ field, label, from, to })
  }

  return changes
}

function normalise(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}
