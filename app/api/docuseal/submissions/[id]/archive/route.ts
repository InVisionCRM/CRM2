import { NextRequest, NextResponse } from 'next/server';
import { docusealFetch } from '@/lib/docuseal';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const dsRes = await docusealFetch(`/submissions/${id}`, { method: 'DELETE' });

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

    // DocuSeal may answer an archive with an empty body.
    const text = await dsRes.text();
    return NextResponse.json(text ? JSON.parse(text) : { id, archived: true });
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