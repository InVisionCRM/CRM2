import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ScopeOfWorkRequest {
  firstName: string
  lastName: string
  job_number?: string
  date?: string
  company_name?: string
  address?: string
  shingle_manufacturer_1?: string
  shingle_manufacturer_2?: string
  shingle_style?: string
  shingle_color?: string
  ventilation_existing?: boolean
  ventilation_adding?: boolean
  roofing_additional_info?: string
  scope_gutters_downspouts?: boolean
  scope_none_gutters?: boolean
  gutter_size_standard?: boolean
  gutter_size_oversized?: boolean
  gutter_color?: string
  gutter_guards_yes?: boolean
  gutter_guards_no?: boolean
  gutter_guards_warranty_yes?: boolean
  gutter_guards_warranty_no?: boolean
  gutters_additional_info?: string
  siding_spec?: string
  siding_color?: string
  corner_color?: string
  gable_vent_color?: string
  shutters_detach_reset?: boolean
  shutters_replace?: boolean
  shutters_remove_discard?: boolean
  shutters_na?: boolean
  scope_facia?: boolean
  scope_soffit?: boolean
  scope_wraps?: boolean
  scope_none_facia_soffit_wrap?: boolean
  facia_soffit_wrap_color?: string
  siding_additional_info?: string
  solar_company?: string
  solar_panels_number?: number
  solar_contact_info?: string
  solar_owned?: boolean
  solar_leased?: boolean
  critter_cage_yes?: boolean
  critter_cage_no?: boolean
  critter_cage_unknown?: boolean
  solar_additional_info?: string
  hoa_contact_info?: string
  satellite_keep?: boolean
  satellite_dispose?: boolean
  satellite_none?: boolean
  detached_structure_exists_yes?: boolean
  detached_structure_exists_no?: boolean
  detached_structure_work_yes?: boolean
  detached_structure_work_no?: boolean
  detached_structure_work_tbd?: boolean
  detached_structure_description?: string
  driveway_damage_yes?: boolean
  driveway_damage_no?: boolean
  driveway_damage_description?: string
  landscaping_protection_notes?: string
  additional_notes?: string
  leadId?: string
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

    // 3. Validate DocuSeal env vars
    const { DOCUSEAL_URL, DOCUSEAL_API_KEY } = process.env
    if (!DOCUSEAL_URL || !DOCUSEAL_API_KEY) {
      console.error('❌ Missing DocuSeal configuration', {
        DOCUSEAL_URL: !!DOCUSEAL_URL,
        DOCUSEAL_API_KEY: !!DOCUSEAL_API_KEY,
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

    // Convert form data to DocuSeal values format
    const values = {
      ...formData,
      current_date: today,
    }

    const docusealBody = {
      template_id: 6, // DOCUSEAL_TEMPLATE_ID=6
      send_email: true, // Send email automatically
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
      url: `${DOCUSEAL_URL}/api/submissions`,
      templateId: docusealBody.template_id,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: leadEmail,
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