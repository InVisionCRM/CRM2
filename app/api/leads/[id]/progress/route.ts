import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { docusealFetch } from '@/lib/docuseal'

/**
 * The job rail for a lead: Contract -> Adjuster -> Scope of Work.
 *
 * Documents come from DocuSeal - submissions are stamped with
 * `external_id = leadId` and each submitter row carries its own `template`,
 * so one request covers every document. A document stage turns green when the
 * client has SIGNED (`completed_at`), never merely when it was sent.
 *
 * The adjuster stage comes from the lead's own columns.
 */

/** green | amber | grey. Kept generic so every stage speaks the same language. */
export type StageState = 'done' | 'active' | 'todo'

interface Stage {
  key: 'contract' | 'adjuster' | 'scopeOfWork'
  label: string
  state: StageState
  /** One line under the label, already phrased for this stage. */
  detail: string
  /** Set only when there is a signed document to open. */
  submissionId: number | null
}

function classify(templateName: string): 'contract' | 'scopeOfWork' | null {
  const n = templateName.toLowerCase()
  if (n.includes('scope of work')) return 'scopeOfWork'
  if (n.includes('general agreement') || n.includes('general contract')) return 'contract'
  return null
}

function shortDate(value: Date | string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leadId } = await params

  try {
    const [lead, res] = await Promise.all([
      prisma.lead.findUnique({
        where: { id: leadId },
        select: {
          insuranceAdjusterName: true,
          adjusterAppointmentDate: true,
          adjusterAppointmentTime: true,
        },
      }),
      docusealFetch(`/submitters?external_id=${encodeURIComponent(leadId)}`),
    ])

    if (!res.ok) {
      const details = await res.text()
      return NextResponse.json({ error: `DocuSeal lookup failed: ${res.status}`, details }, { status: 502 })
    }
    const body = await res.json()
    const rows: any[] = Array.isArray(body) ? body : (body.data ?? [])

    /* ---------------- documents ---------------- */
    const docs: Record<'contract' | 'scopeOfWork', Stage> = {
      contract: { key: 'contract', label: 'Contract', state: 'todo', detail: 'Not sent', submissionId: null },
      scopeOfWork: { key: 'scopeOfWork', label: 'Scope of Work', state: 'todo', detail: 'Not sent', submissionId: null },
    }

    rows.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())

    for (const row of rows) {
      const key = classify(row.template?.name ?? '')
      if (!key) continue
      const stage = docs[key]
      if (stage.state === 'done') continue // a signature is never downgraded by a later draft

      if (row.completed_at) {
        stage.state = 'done'
        stage.detail = `Signed ${shortDate(row.completed_at)}`
        stage.submissionId = row.submission_id
      } else if (row.sent_at && stage.state === 'todo') {
        stage.state = 'active'
        stage.detail = `Sent ${shortDate(row.sent_at)} — awaiting signature`
        stage.submissionId = row.submission_id
      }
    }

    /* ---------------- adjuster ---------------- */
    const adjusterName = lead?.insuranceAdjusterName?.trim() || ''
    const apptDate = lead?.adjusterAppointmentDate ?? null
    const apptTime = lead?.adjusterAppointmentTime?.trim() || ''

    const adjuster: Stage = {
      key: 'adjuster',
      label: 'Adjuster',
      state: 'todo',
      detail: 'No adjuster assigned',
      submissionId: null,
    }

    if (adjusterName) {
      if (apptDate && new Date(apptDate).getTime() < Date.now()) {
        // The inspection date has passed - treat the meeting as held.
        adjuster.state = 'done'
        adjuster.detail = `${adjusterName} — inspected ${shortDate(apptDate)}`
      } else if (apptDate) {
        adjuster.state = 'active'
        adjuster.detail = `${adjusterName} — ${shortDate(apptDate)}${apptTime ? ` at ${apptTime}` : ''}`
      } else {
        adjuster.state = 'active'
        adjuster.detail = `${adjusterName} — no inspection booked`
      }
    }

    // Contract -> Adjuster -> Scope of Work
    return NextResponse.json({ stages: [docs.contract, adjuster, docs.scopeOfWork] })
  } catch (err) {
    console.error('💥 Failed to load lead progress', err)
    return NextResponse.json(
      { error: 'Failed to load progress', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
