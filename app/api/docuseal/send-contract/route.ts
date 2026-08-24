import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { docusealFetch, signatureRequestMessage, signingUrl, templateId, type TemplateKind } from '@/lib/docuseal'

interface SendContractRequest {
  leadId: string
  contractType?: TemplateKind
  additionalData?: {
    insuranceCompany?: string
    claimNumber?: string
    [key: string]: any
  }
}

export async function POST(req: Request) {
  console.log('🔵 [DocuSeal] /api/docuseal/send-contract request received')

  try {
    // 1. Parse request body
    const { leadId, contractType = 'generalContract', additionalData } =
      (await req.json().catch(() => ({}))) as SendContractRequest

    if (!leadId) {
      console.error('❌ Missing leadId in request body')
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    // 2. Fetch lead details from database
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        insuranceCompany: true,
        claimNumber: true,
      },
    })

    if (!lead || !lead.email || !lead.firstName || !lead.lastName) {
      console.error('❌ Invalid or incomplete lead data', { lead })
      return NextResponse.json(
        {
          error: 'Invalid lead data',
          details: 'Lead must exist and have email, firstName and lastName',
        },
        { status: 400 },
      )
    }

    // 3. Build DocuSeal request body
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Merge lead data with additional data
    // additionalData is spread FIRST so caller-supplied keys can add fields but
    // never overwrite verified lead data.
    const values = {
      ...additionalData,
      firstName: lead.firstName,
      lastName: lead.lastName,
      fullName: `${lead.firstName} ${lead.lastName}`.trim(),
      phone: lead.phone || '',
      address: lead.address || '',
      email: lead.email,
      current_date: today,
      insuranceCompany: lead.insuranceCompany || additionalData?.insuranceCompany || '',
      claimNumber: lead.claimNumber || additionalData?.claimNumber || '',
    }

    const docusealBody = {
      template_id: templateId(contractType),
      send_email: true,
      message: signatureRequestMessage(),
      submitters: [
        {
          role: 'First Party',
          email: lead.email,
          name: `${lead.firstName} ${lead.lastName}`.trim(),
          values,
        },
      ],
    }

    console.log('📤 Sending submission to DocuSeal', {
      contractType,
      templateId: docusealBody.template_id,
      signerEmail: lead.email,
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
    const submissionId = Array.isArray(created)
      ? created[0]?.submission_id
      : created.id
    if (!submissionId) {
      throw new Error('DocuSeal returned no submission id')
    }

    // Read the submission back so the confirmation reports what DocuSeal
    // actually did, not merely that our request was accepted. `sent_at` is
    // populated only once the signature-request email has gone out.
    const checkRes = await docusealFetch(`/submissions/${submissionId}`)
    if (!checkRes.ok) {
      throw new Error(`Could not confirm submission ${submissionId}: ${checkRes.status}`)
    }
    const submission = await checkRes.json()
    const submitter = submission.submitters?.[0]
    if (!submitter) {
      throw new Error(`Submission ${submissionId} came back with no submitters`)
    }

    console.log('✅ DocuSeal submission created', {
      id: submissionId,
      sentAt: submitter.sent_at,
    })

    return NextResponse.json({
      sent: Boolean(submitter.sent_at),
      sentAt: submitter.sent_at ?? null,
      submissionId,
      templateName: submission.template?.name ?? 'Contract',
      signingUrl: signingUrl(submitter.slug),
      client: {
        name: submitter.name ?? `${lead.firstName} ${lead.lastName}`.trim(),
        email: submitter.email ?? lead.email,
        phone: lead.phone ?? null,
      },
    })
  } catch (err) {
    console.error('💥 Unexpected error in /api/docuseal/send-contract', err)
    return NextResponse.json(
      {
        error: 'Failed to send contract',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
