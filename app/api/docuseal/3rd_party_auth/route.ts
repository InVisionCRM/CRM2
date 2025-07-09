import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ThirdPartyAuthSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  mortgageCompany: z.string().min(1),
  loanNumber: z.string().min(1),
  insuranceCompany: z.string().min(1),
  claimNumber: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = ThirdPartyAuthSchema.parse(body);

    const { DOCUSEAL_URL, DOCUSEAL_API_KEY } = process.env;
    if (!DOCUSEAL_URL || !DOCUSEAL_API_KEY) {
      console.error('❌ Missing DocuSeal configuration', { DOCUSEAL_URL, DOCUSEAL_API_KEY });
      return NextResponse.json({ error: 'DocuSeal configuration missing' }, { status: 500 });
    }

    const values = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      mortgageCompany: data.mortgageCompany,
      loanNumber: data.loanNumber,
      insuranceCompany: data.insuranceCompany,
      claimNumber: data.claimNumber,
      email: data.email,
    };

    const docusealBody = {
      template_id: 3,
      send_email: true,
      submitters: [
        {
          role: 'First Party',
          email: data.email,
          name: `${data.firstName} ${data.lastName}`.trim(),
          values,
        },
      ],
    };

    console.log('📤 Sending 3rd Party Auth contract to DocuSeal', {
      url: `${DOCUSEAL_URL}/api/submissions`,
      templateId: docusealBody.template_id,
      signerEmail: data.email,
      values,
    });

    const dsRes = await fetch(`${DOCUSEAL_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': DOCUSEAL_API_KEY,
      },
      body: JSON.stringify(docusealBody),
    });

    console.log('📨 DocuSeal response status:', dsRes.status, dsRes.statusText);

    if (!dsRes.ok) {
      const errorText = await dsRes.text();
      console.error('❌ DocuSeal API error:', { status: dsRes.status, errorText });
      return NextResponse.json(
        {
          error: `DocuSeal API error: ${dsRes.status} ${dsRes.statusText}`,
          details: errorText,
        },
        { status: 500 },
      );
    }

    const submission = await dsRes.json();
    console.log('✅ DocuSeal 3rd Party Auth submission created', { id: submission.id });

    return NextResponse.json(submission);
  } catch (err: any) {
    console.error('💥 Unexpected error in /api/docuseal/3rd_party_auth', err);
    return NextResponse.json(
      {
        error: 'Failed to send 3rd party auth contract',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export const dynamic = 'force-dynamic'; 