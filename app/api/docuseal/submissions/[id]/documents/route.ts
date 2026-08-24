import { NextResponse } from 'next/server';
import { docusealFetch } from '@/lib/docuseal';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔵 Fetching DocuSeal submission documents');
  
  try {
    const { id } = await params;
    
    console.log('📤 Fetching documents from DocuSeal:', { submissionId: id });

    // Fetch documents from DocuSeal API
    const response = await docusealFetch(`/submissions/${id}/documents`, { method: 'GET' });

    console.log('📨 DocuSeal documents response status:', response.status, response.statusText);

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

    // DocuSeal Cloud returns { id, documents: [{name, url}] }; self-hosted returned
    // a bare array. Normalise here so callers always get an array.
    const data = await response.json();
    const documents = Array.isArray(data) ? data : (data.documents ?? []);

    console.log('✅ DocuSeal documents fetched successfully:', {
      count: documents.length,
      submissionId: id
    });

    return NextResponse.json(documents);

  } catch (error) {
    console.error('💥 Error fetching DocuSeal documents:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    
    return NextResponse.json({ 
      error: 'Failed to fetch submission documents',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
} 