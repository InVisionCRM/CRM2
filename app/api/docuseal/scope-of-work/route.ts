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

    // 2. Get lead email if leadId is provided
    let leadEmail = ''
    if (formData.leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: formData.leadId },
        select: { email: true },
      })
      leadEmail = lead?.email || ''
    }

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

    const docusealBody = {
      template_id: templateId('scopeOfWork'),
      send_email: true, // Send email automatically
      message: signatureRequestMessage(),
      submitters: [
        {
          role: 'First Party',
          email: leadEmail,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          values,
        },
      ],
    }

    console.log('📤 Sending scope of work to DocuSeal', {
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

    const submission = await dsRes.json()
    console.log('✅ DocuSeal scope of work submission created', { id: submission.id })

    return NextResponse.json(submission)
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