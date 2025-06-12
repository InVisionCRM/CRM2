import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔵 Fetching DocuSeal submission documents');
  
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

    const apiUrl = `${process.env.DOCUSEAL_URL}/api/submissions/${id}/documents`;
    
    console.log('📤 Fetching documents from DocuSeal:', {
      url: apiUrl,
      submissionId: id
    });

    // Fetch documents from DocuSeal API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Auth-Token': process.env.DOCUSEAL_API_KEY,
        'Content-Type': 'application/json'
      }
    });

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
        details: errorText,
        docusealUrl: process.env.DOCUSEAL_URL
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ DocuSeal documents fetched successfully:', {
      count: data.length || 0,
      submissionId: id
    });
    
    return NextResponse.json(data);

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