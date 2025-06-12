import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔵 Fetching DocuSeal submission details');
  
  try {
    const { id } = await params;
    
    // Check environment variables
    if (!process.env.DOCUSEAL_URL || !process.env.DOCUSEAL_API_KEY) {
      console.error('❌ Missing DocuSeal environment variables');
      return NextResponse.json({ 
        error: 'DocuSeal configuration missing',
        missing: {
          url: !process.env.DOCUSEAL_URL,
          apiKey: !process.env.DOCUSEAL_API_KEY,
        }
      }, { status: 500 });
    }

    const apiUrl = `${process.env.DOCUSEAL_URL}/api/submissions/${id}`;
    
    console.log('📤 Fetching submission details from DocuSeal:', {
      url: apiUrl,
      submissionId: id
    });

    // Fetch submission details from DocuSeal API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Auth-Token': process.env.DOCUSEAL_API_KEY,
        'Content-Type': 'application/json'
      }
    });

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
        details: errorText,
        docusealUrl: process.env.DOCUSEAL_URL
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