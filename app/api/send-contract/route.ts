// /app/api/send-contract/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('🔵 Send contract request received');
  
  try {
    // Parse request body
    let lead;
    try {
      const requestData = await req.json();
      lead = requestData.lead || requestData; // Handle both { lead: {...} } and direct {...} formats
      console.log('✅ Request body parsed successfully:', { 
        hasLead: !!lead,
        leadKeys: lead ? Object.keys(lead) : [],
        fullLeadData: lead,
        originalRequestKeys: Object.keys(requestData)
      });
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: parseError instanceof Error ? parseError.message : 'Failed to parse JSON'
      }, { status: 400 });
    }

    // Validate lead data with detailed logging
    console.log('🔍 Validating lead data:', {
      hasEmail: !!lead?.email,
      email: lead?.email,
      hasFirstName: !!lead?.firstName,
      firstName: lead?.firstName,
      hasLastName: !!lead?.lastName,
      lastName: lead?.lastName,
      allFields: lead
    });

    if (!lead || !lead.email || !lead.firstName || !lead.lastName) {
      console.error('❌ Invalid lead data:', {
        lead,
        missing: {
          email: !lead?.email,
          firstName: !lead?.firstName,
          lastName: !lead?.lastName
        }
      });
      return NextResponse.json({ 
        error: 'Invalid lead data', 
        details: 'Lead must have email, firstName, and lastName',
        received: lead,
        missing: {
          email: !lead?.email,
          firstName: !lead?.firstName,
          lastName: !lead?.lastName
        }
      }, { status: 400 });
    }

    // Check environment variables
    const envVars = {
      DOCUSEAL_URL: process.env.DOCUSEAL_URL,
      DOCUSEAL_API_KEY: process.env.DOCUSEAL_API_KEY ? '[SET]' : '[NOT SET]',
      DOCUSEAL_TEMPLATE_ID: process.env.DOCUSEAL_TEMPLATE_ID
    };
    console.log('🔧 Environment variables:', envVars);

    if (!process.env.DOCUSEAL_URL || !process.env.DOCUSEAL_API_KEY || !process.env.DOCUSEAL_TEMPLATE_ID) {
      console.error('❌ Missing environment variables');
      return NextResponse.json({ 
        error: 'DocuSeal configuration missing',
        missing: {
          url: !process.env.DOCUSEAL_URL,
          apiKey: !process.env.DOCUSEAL_API_KEY,
          templateId: !process.env.DOCUSEAL_TEMPLATE_ID
        }
      }, { status: 500 });
    }

    // Updated request body to match DocuSeal API specification
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const requestBody = {
      template_id: parseInt(process.env.DOCUSEAL_TEMPLATE_ID),
      send_email: true,
      submitters: [{
        role: "First Party", // This should match a role in your template
        email: lead.email,
        name: `${lead.firstName} ${lead.lastName}`,
        // Pre-fill form fields if needed
        values: {
          "firstName": lead.firstName,
          "lastName": lead.lastName,
          "phone": lead.phone || '',
          "address": lead.address || '',
          "email": lead.email,
          "current_date": today,
        }
      }]
    };

    console.log('📤 Sending request to DocuSeal:', {
      url: `${process.env.DOCUSEAL_URL}/api/submissions`,
      templateId: process.env.DOCUSEAL_TEMPLATE_ID,
      signerEmail: lead.email,
      requestBody
    });

    // Updated to use correct DocuSeal API endpoint
    const response = await fetch(`${process.env.DOCUSEAL_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': process.env.DOCUSEAL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
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
      }, { status: 500 });
    }

    const json = await response.json();
    console.log('✅ DocuSeal response received successfully:', json);
    return NextResponse.json(json);

  } catch (error) {
    console.error('💥 Send contract error:', {
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
      error: 'Failed to send contract',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}
