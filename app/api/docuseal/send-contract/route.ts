import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-log'
import { confirmSubmission, docusealFetch, signatureRequestMessage, templateId, type TemplateKind } from '@/lib/docuseal'

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
          // Lets the lead page find this contract without a schema change.
          external_id: leadId,
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
    const confirmation = await confirmSubmission(created, lead.phone ?? null)
    if (!confirmation.client.name) confirmation.client.name = `${lead.firstName} ${lead.lastName}`.trim()
    if (!confirmation.client.email) confirmation.client.email = lead.email

    console.log('✅ DocuSeal submission created', {
      id: confirmation.submissionId,
      sentAt: confirmation.sentAt,
    })

    const session = await getServerSession(authOptions).catch(() => null)
    await logActivity({
      type: 'CONTRACT_SENT',
      title: `${confirmation.templateName} sent to ${confirmation.client.name}`,
      leadId,
      userId: (session as any)?.user?.id ?? null,
      metadata: {
        verb: 'SENT',
        entity: 'contract',
        changes: [
          { field: 'document', label: 'Document', from: null, to: confirmation.templateName },
          { field: 'recipient', label: 'Sent to', from: null, to: confirmation.client.email },
        ],
      },
    })

    return NextResponse.json(confirmation)
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
