import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log('🔵 Fetching DocuSeal submissions');
  
  try {
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

    // Parse URL parameters for filtering
    const url = new URL(req.url);
    const searchParams = new URLSearchParams();
    
    // Add query parameters if provided
    const status = url.searchParams.get('status');
    const templateId = url.searchParams.get('template_id');
    const limit = url.searchParams.get('limit') || '50'; // Default limit
    const q = url.searchParams.get('q');
    const archived = url.searchParams.get('archived');
    
    if (status) searchParams.append('status', status);
    if (templateId) searchParams.append('template_id', templateId);
    if (q) searchParams.append('q', q);
    if (archived) searchParams.append('archived', archived);
    searchParams.append('limit', limit);

    const apiUrl = `${process.env.DOCUSEAL_URL}/api/submissions${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    console.log('📤 Fetching from DocuSeal:', {
      url: apiUrl,
      params: Object.fromEntries(searchParams)
    });

    // Fetch submissions from DocuSeal API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Auth-Token': process.env.DOCUSEAL_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('📨 DocuSeal response status:', response.status, response.statusText);

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
    console.log('✅ DocuSeal submissions fetched successfully:', {
      count: data.data?.length || 0,
      totalPages: data.pagination?.count || 0
    });
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('💥 Error fetching DocuSeal submissions:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      return NextResponse.json({ 
        error: 'Failed to connect to DocuSeal API',
        details: 'Connection refused. Please check DocuSeal URL and network connectivity.',
        docusealUrl: process.env.DOCUSEAL_URL,
        suggestion: 'Verify DocuSeal service is running and accessible'
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch submissions',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
} 