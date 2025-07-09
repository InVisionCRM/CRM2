import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { DOCUSEAL_URL, DOCUSEAL_API_KEY } = process.env;

  if (!DOCUSEAL_URL || !DOCUSEAL_API_KEY) {
    console.error('❌ Missing DocuSeal configuration', { DOCUSEAL_URL, DOCUSEAL_API_KEY });
    return NextResponse.json({ error: 'DocuSeal configuration missing' }, { status: 500 });
  }

  try {
    const apiUrl = `${DOCUSEAL_URL}/api/submissions/${id}`;
    const dsRes = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!dsRes.ok) {
      const errorText = await dsRes.text();
      console.error('❌ DocuSeal API error:', { status: dsRes.status, errorText });
      return NextResponse.json(
        {
          error: `DocuSeal API error: ${dsRes.status} ${dsRes.statusText}`,
          details: errorText,
        },
        { status: dsRes.status },
      );
    }

    const result = await dsRes.json();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('💥 Error archiving DocuSeal submission:', err);
    return NextResponse.json(
      {
        error: 'Failed to archive submission',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
} 