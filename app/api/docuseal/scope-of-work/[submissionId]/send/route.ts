import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { confirmSubmission, docusealFetch } from '@/lib/docuseal'
import { logActivity } from '@/lib/activity-log'

/**
 * Approve a scope-of-work draft and mail it to the client.
 *
 * The draft was created with `send_email: false` so the rep could review the
 * real rendered PDF first. This is the only place the client is emailed.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params

  try {
    const lookup = await docusealFetch(`/submissions/${submissionId}`)
    if (!lookup.ok) {
      return NextResponse.json(
        { error: 'That draft no longer exists', details: `DocuSeal returned ${lookup.status}` },
        { status: 404 },
      )
    }
    const submission = await lookup.json()
    const submitter = submission.submitters?.[0]
    if (!submitter?.id) {
      return NextResponse.json({ error: 'Draft has no signer to send to' }, { status: 400 })
    }
    if (submitter.sent_at) {
      return NextResponse.json(
        { error: 'This scope of work was already sent', details: `Sent ${submitter.sent_at}` },
        { status: 409 },
      )
    }

    const sendRes = await docusealFetch(`/submitters/${submitter.id}`, {
      method: 'PUT',
      body: JSON.stringify({ send_email: true }),
    })
    if (!sendRes.ok) {
      const details = await sendRes.text()
      return NextResponse.json(
        { error: `DocuSeal refused to send: ${sendRes.status}`, details },
        { status: 502 },
      )
    }

    // DocuSeal populates `sent_at` asynchronously, so a confirmation read back
    // immediately can legitimately still show it as null. confirmSubmission
    // reports that honestly as "Queued" rather than claiming it was delivered.
    const confirmation = await confirmSubmission({ id: Number(submissionId) }, null)

    console.log('✅ Scope of work sent', {
      submissionId,
      sentAt: confirmation.sentAt,
    })

    // external_id was stamped with the leadId when the draft was created.
    const leadId = submitter.external_id
    if (leadId) {
      const session = await getServerSession(authOptions).catch(() => null)
      await logActivity({
        type: 'CONTRACT_SENT',
        title: `Scope of Work sent to ${confirmation.client.name}`,
        leadId,
        userId: (session as any)?.user?.id ?? null,
        metadata: {
          verb: 'SENT',
          entity: 'contract',
          changes: [
            { field: 'document', label: 'Document', from: null, to: 'Scope of Work' },
            { field: 'recipient', label: 'Sent to', from: null, to: confirmation.client.email },
          ],
        },
      })
    }

    return NextResponse.json(confirmation)
  } catch (err) {
    console.error('💥 Failed to send scope of work', err)
    return NextResponse.json(
      {
        error: 'Failed to send scope of work',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
