import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { docusealFetch, signatureRequestMessage, templateId } from '@/lib/docuseal'

interface ScopeOfWorkRequest {
  leadId: string
  // Field names below are the `name=` attributes on ScopeOfWorkForm.tsx.
  // The route spreads formData straight through to DocuSeal, so these strings
  // must stay identical to the form AND to the field names in the DocuSeal
  // template. Change one, change all three.
  [key: string]: string | number | boolean | undefined

}

export async function POST(req: Request) {
  console.log('🔵 [DocuSeal] /api/docuseal/scope-of-work request received')

  try {
    // 1. Parse request body
    const formData = await req.json().catch(() => ({})) as ScopeOfWorkRequest

    if (!formData.firstName || !formData.lastName) {
      console.error('❌ Missing required fields: firstName and lastName')
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 })
    }

    // 2. Resolve the signer. DocuSeal accepts an empty email and silently creates
    //    a submission nobody can sign, so refuse rather than pretend it worked.
    if (!formData.leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }
    const lead = await prisma.lead.findUnique({
      where: { id: String(formData.leadId) },
      select: { email: true, phone: true },
    })
    if (!lead?.email) {
      return NextResponse.json(
        {
          error: 'This lead has no email address',
          details: 'Add an email to the lead before sending the scope of work.',
        },
        { status: 400 },
      )
    }
    const leadEmail = lead.email

    // 3. Build DocuSeal request body
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Convert form data to DocuSeal values format
    const values = {
      ...formData,
      current_date: today,
    }

    // Created UNSENT. The rep reviews the real rendered PDF and approves before
    // anything reaches the client; POST .../send is what actually mails it.
    const docusealBody = {
      template_id: templateId('scopeOfWork'),
      send_email: false,
      message: signatureRequestMessage(),
      submitters: [
        {
          role: 'First Party',
          email: leadEmail,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          // Lets the lead page find this submission later without a schema change.
          external_id: String(formData.leadId),
          values,
        },
      ],
    }

    console.log('📤 Creating scope of work draft', {
      templateId: docusealBody.template_id,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: leadEmail,
    })

    // 4. Call DocuSeal API
    const dsRes = await docusealFetch('/submissions', {
      method: 'POST',
      body: JSON.stringify(docusealBody),
    })

    console.log('📨 DocuSeal response status:', dsRes.status, dsRes.statusText)

    if (!dsRes.ok) {
      const errorText = await dsRes.text()
      console.error('❌ DocuSeal API error:', { status: dsRes.status, errorText })
      return NextResponse.json(
        {
          error: `DocuSeal API error: ${dsRes.status} ${dsRes.statusText}`,
          details: errorText,
        },
        { status: 500 },
      )
    }

    const created = await dsRes.json()
    const submitter = Array.isArray(created) ? created[0] : created.submitters?.[0]
    const submissionId = submitter?.submission_id ?? created.id
    if (!submissionId || !submitter?.id) {
      throw new Error('DocuSeal returned no draft submission')
    }

    // The rendered PDF exists before signing - this is the document the client
    // will actually receive, not a mock-up of it.
    const docsRes = await docusealFetch(`/submissions/${submissionId}/documents`)
    if (!docsRes.ok) {
      throw new Error(`Draft ${submissionId} has no preview document`)
    }
    const docsBody = await docsRes.json()
    const documents = Array.isArray(docsBody) ? docsBody : (docsBody.documents ?? [])
    if (documents.length === 0) {
      throw new Error(`Draft ${submissionId} returned an empty document list`)
    }

    console.log('📝 Scope of work draft ready for review', { submissionId })

    return NextResponse.json({
      submissionId,
      submitterId: submitter.id,
      previewUrl: documents[0].url,
      client: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: leadEmail,
        phone: lead.phone ?? null,
      },
    })
  } catch (err) {
    console.error('💥 Unexpected error in /api/docuseal/scope-of-work', err)
    return NextResponse.json(
      {
        error: 'Failed to submit scope of work',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
} 