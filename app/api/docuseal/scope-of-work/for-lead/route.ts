import { NextResponse } from 'next/server'
import { docusealFetch } from '@/lib/docuseal'

/**
 * Latest scope of work for a lead.
 *
 * Submissions are stamped with `external_id = leadId` when the draft is
 * created, so this needs no column on the Lead table. Drafts that were never
 * approved are excluded - only something actually sent counts.
 */
export async function GET(req: Request) {
  const leadId = new URL(req.url).searchParams.get('leadId')
  if (!leadId) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
  }

  try {
    const res = await docusealFetch(`/submitters?external_id=${encodeURIComponent(leadId)}`)
    if (!res.ok) {
      const details = await res.text()
      return NextResponse.json(
        { error: `DocuSeal lookup failed: ${res.status}`, details },
        { status: 502 },
      )
    }

    const body = await res.json()
    const submitters: any[] = Array.isArray(body) ? body : (body.data ?? [])
    const sent = submitters.filter((s) => s.sent_at)
    if (sent.length === 0) {
      return NextResponse.json({ scope: null })
    }

    // Newest first.
    sent.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
    const latest = sent[0]

    const detail = await docusealFetch(`/submissions/${latest.submission_id}`)
    if (!detail.ok) {
      return NextResponse.json({ error: 'Could not load that scope of work' }, { status: 502 })
    }
    const submission = await detail.json()
    const submitter = submission.submitters?.[0]

    // values arrive as [{field, value}] - collapse to a lookup
    const values: Record<string, unknown> = {}
    for (const v of submitter?.values ?? []) values[v.field] = v.value

    return NextResponse.json({
      scope: {
        submissionId: submission.id,
        status: submission.status,
        sentAt: submitter?.sent_at ?? null,
        completedAt: submission.completed_at ?? null,
        signingUrl: submitter?.slug ? `/s/${submitter.slug}` : null,
        values,
      },
    })
  } catch (err) {
    console.error('💥 Failed to load scope of work for lead', err)
    return NextResponse.json(
      {
        error: 'Failed to load scope of work',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
