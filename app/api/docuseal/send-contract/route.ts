import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  console.log('🔵 [DocuSeal] /api/docuseal/send-contract request received')

  try {
    // 1. Parse request body expecting { leadId: string }
    const { leadId } = await req.json().catch(() => ({})) as { leadId?: string }

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

    // 3. Validate DocuSeal env vars
    const { DOCUSEAL_URL, DOCUSEAL_API_KEY, DOCUSEAL_TEMPLATE_ID } = process.env
    if (!DOCUSEAL_URL || !DOCUSEAL_API_KEY || !DOCUSEAL_TEMPLATE_ID) {
      console.error('❌ Missing DocuSeal configuration', {
        DOCUSEAL_URL: !!DOCUSEAL_URL,
        DOCUSEAL_API_KEY: !!DOCUSEAL_API_KEY,
        DOCUSEAL_TEMPLATE_ID: !!DOCUSEAL_TEMPLATE_ID,
      })
      return NextResponse.json(
        {
          error: 'DocuSeal configuration missing',
        },
        { status: 500 },
      )
    }

    // 4. Build DocuSeal request body
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const docusealBody = {
      template_id: parseInt(DOCUSEAL_TEMPLATE_ID),
      send_email: true,
      submitters: [
        {
          role: 'First Party',
          email: lead.email,
          name: `${lead.firstName} ${lead.lastName}`.trim(),
          values: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            phone: lead.phone || '',
            address: lead.address || '',
            email: lead.email,
            current_date: today,
          },
        },
      ],
    }

    console.log('📤 Sending submission to DocuSeal', {
      url: `${DOCUSEAL_URL}/api/submissions`,
      templateId: DOCUSEAL_TEMPLATE_ID,
      signerEmail: lead.email,
    })

    // 5. Call DocuSeal API
    const dsRes = await fetch(`${DOCUSEAL_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': DOCUSEAL_API_KEY,
      },
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

    const submission = await dsRes.json()
    console.log('✅ DocuSeal submission created', { id: submission.id })

    return NextResponse.json(submission)
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