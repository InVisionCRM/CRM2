import { NextResponse } from 'next/server'
import { docusealFetch } from '@/lib/docuseal'

/**
 * Discard a scope-of-work draft the rep decided not to send.
 *
 * DocuSeal's DELETE archives rather than destroys, so the draft stays
 * recoverable. Nothing was ever emailed - the draft is created unsent.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params

  try {
    const res = await docusealFetch(`/submissions/${submissionId}`, { method: 'DELETE' })
    if (!res.ok) {
      const details = await res.text()
      return NextResponse.json(
        { error: `Could not discard draft: ${res.status}`, details },
        { status: 502 },
      )
    }

    // DocuSeal may answer with an empty body.
    const text = await res.text()
    return NextResponse.json(text ? JSON.parse(text) : { id: submissionId, discarded: true })
  } catch (err) {
    console.error('💥 Failed to discard scope of work draft', err)
    return NextResponse.json(
      {
        error: 'Failed to discard draft',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
