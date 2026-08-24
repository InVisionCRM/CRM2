import { NextResponse } from 'next/server';
import { docusealFetch } from '@/lib/docuseal';

const statusMap: Record<string, string> = {
  awaiting: "Sent",
  sent: "Sent",
  opened: "Opened",
  partially_completed: "Partially completed",
  completed: "Completed",
  declined: "Declined",
  expired: "Expired",
  pending: "Pending",
};

export async function GET(req: Request) {
  console.log('🔵 Fetching DocuSeal submissions');
  
  try {
    // Parse URL parameters for filtering
    const url = new URL(req.url);
    const searchParams = new URLSearchParams();
    
    // Add query parameters if provided
    const status = url.searchParams.get('status');
    const templateId = url.searchParams.get('template_id');
    const limit = url.searchParams.get('limit') || '50'; // Default limit
    const q = url.searchParams.get('q');
    const archived = url.searchParams.get('archived');
    const email = url.searchParams.get('email'); // Add email filtering
    
    const after = url.searchParams.get('after');
    const before = url.searchParams.get('before');
    if (after) searchParams.append('after', after);
    if (before) searchParams.append('before', before);
    if (status) searchParams.append('status', status);
    if (templateId) searchParams.append('template_id', templateId);
    if (q) searchParams.append('q', q);
    if (archived) searchParams.append('archived', archived);
    searchParams.append('limit', limit);

    const apiPath = `/submissions${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

    console.log('📤 Fetching from DocuSeal:', {
      path: apiPath,
      params: Object.fromEntries(searchParams)
    });

    // Fetch submissions from DocuSeal API
    const response = await docusealFetch(apiPath, { method: 'GET' });

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
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Filter by email if provided (since DocuSeal API might not support email filtering directly)
    let filteredData = data;
    if (email) {
      console.log('🔍 Filtering submissions by email:', email);
      const emailLower = email.toLowerCase();
      filteredData = {
        ...data,
        data: data.data?.filter((submission: any) => 
          submission.submitters?.some((submitter: any) => 
            submitter.email?.toLowerCase() === emailLower
          )
        ) || []
      };
      console.log('📊 Email filter results:', {
        originalCount: data.data?.length || 0,
        filteredCount: filteredData.data?.length || 0,
        email: email
      });
    }

    // Add displayStatus to each submission and log raw statuses
    if (filteredData.data && Array.isArray(filteredData.data)) {
      filteredData.data.forEach((submission: any) => {
        console.log('Docuseal raw status:', submission.status, 'Submitters:', submission.submitters?.map((s: any) => s.status));
      });
      filteredData.data = filteredData.data.map((submission: any) => {
        const submitterStatus = submission.submitters && submission.submitters.length > 0 ? submission.submitters[0].status : undefined;
        const displayStatus = statusMap[submitterStatus] || statusMap[submission.status] || submitterStatus || submission.status;
        return {
          ...submission,
          displayStatus,
        };
      });
    }
    
    console.log('✅ DocuSeal submissions fetched successfully:', {
      count: filteredData.data?.length || 0,
      totalPages: filteredData.pagination?.count || 0
    });
    
    return NextResponse.json(filteredData);

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
        details: 'Connection refused. Check DOCUSEAL_API_URL and network connectivity.',
        suggestion: 'Verify the DocuSeal service is reachable'
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch submissions',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
} 