import { NextResponse } from 'next/server';
import { docusealFetch } from '@/lib/docuseal';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔵 Fetching DocuSeal submission details');
  
  try {
    const { id } = await params;
    
    console.log('📤 Fetching submission details from DocuSeal:', { submissionId: id });

    // Fetch submission details from DocuSeal API
    const response = await docusealFetch(`/submissions/${id}`, { method: 'GET' });

    console.log('📨 DocuSeal submission response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DocuSeal API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json({ 
        error: `DocuSeal API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ DocuSeal submission details fetched successfully:', {
      id: data.id,
      status: data.status,
      combined_document_url: data.combined_document_url,
      audit_log_url: data.audit_log_url,
      documents: data.documents?.length || 0,
      submitters: data.submitters?.length || 0
    });
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Error fetching DocuSeal submission:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    
    return NextResponse.json({ 
      error: 'Failed to fetch submission details',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
} 