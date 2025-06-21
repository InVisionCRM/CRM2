import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  console.log('🔵 Sign in person request received');
  
  try {
    const { leadId } = await req.json();
    
    if (!leadId) {
      return NextResponse.json({ 
        error: 'Lead ID is required' 
      }, { status: 400 });
    }

    // Get the lead details
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true
      }
    });

    if (!lead) {
      console.error('❌ Lead not found:', leadId);
      return NextResponse.json({ 
        error: 'Lead not found' 
      }, { status: 404 });
    }

    console.log('📋 Creating in-person signing for lead:', {
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email
    });

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

    // Create embedded submission for in-person signing
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const requestBody = {
      template_id: 2, // Use template 2 for in-person signing
      send_email: false, // Key: Don't send email for in-person signing
      submitters: [{
        role: "First Party",
        email: lead.email,
        name: `${lead.firstName} ${lead.lastName}`,
        // Pre-fill form fields
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

    console.log('📤 Sending in-person signing request to DocuSeal:', {
      url: `${process.env.DOCUSEAL_URL}/api/submissions`,
      templateId: 2, // Updated to show template 2
      signerEmail: lead.email,
      sendEmail: false
    });

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

    const submission = await response.json();
    console.log('✅ In-person signing submission created:', {
      id: submission.id,
      status: submission.status,
      submitters: submission.submitters?.length || 0
    });

    // Log the full response to debug the structure
    console.log('🔍 Full DocuSeal response:', JSON.stringify(submission, null, 2));

    // Handle different response structures from DocuSeal
    let signingUrl;
    let submissionId;
    let submitterData;

    // Check if response is an array of submitters (direct submitter response)
    if (Array.isArray(submission) && submission.length > 0) {
      submitterData = submission[0];
      signingUrl = submitterData.embed_src || submitterData.url;
      submissionId = submitterData.submission_id || submitterData.id;
      console.log('📋 Response is array of submitters');
    } 
    // Check if response is a submission object with submitters array
    else if (submission.submitters && Array.isArray(submission.submitters) && submission.submitters.length > 0) {
      submitterData = submission.submitters[0];
      signingUrl = submitterData.embed_src || submitterData.url;
      submissionId = submission.id;
      console.log('📋 Response is submission object with submitters');
    }
    // Check if response is a single submitter object
    else if (submission.embed_src || submission.url) {
      submitterData = submission;
      signingUrl = submission.embed_src || submission.url;
      submissionId = submission.submission_id || submission.id;
      console.log('📋 Response is single submitter object');
    }

    console.log('🔗 Extracted signing URL:', signingUrl);
    console.log('🔍 Submitter data:', JSON.stringify(submitterData, null, 2));
    
    // If no signing URL found in the initial response, try to fetch submitter details
    if (!signingUrl && submissionId) {
      console.log('🔄 No embed_src found, fetching submission details...');
      
      try {
        const detailResponse = await fetch(`${process.env.DOCUSEAL_URL}/api/submissions/${submissionId}`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': process.env.DOCUSEAL_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          console.log('🔍 Detailed submission response:', JSON.stringify(detailData, null, 2));
          signingUrl = detailData.submitters?.[0]?.embed_src || detailData.submitters?.[0]?.url;
          console.log('🔗 Signing URL from details:', signingUrl);
        }
      } catch (error) {
        console.error('❌ Error fetching submission details:', error);
      }
    }

    // If still no signing URL, try to construct it from submitter slug
    if (!signingUrl && submitterData?.slug) {
      const submitterSlug = submitterData.slug;
      signingUrl = `${process.env.DOCUSEAL_URL}/s/${submitterSlug}`;
      console.log('🔗 Constructed signing URL from slug:', signingUrl);
    }

    // Final fallback: check if we have any submitters at all and try to construct from submission data
    if (!signingUrl && submissionId) {
      console.log('🔄 Trying to list submitters for submission...');
      
      try {
        const submittersResponse = await fetch(`${process.env.DOCUSEAL_URL}/api/submitters?submission_id=${submissionId}`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': process.env.DOCUSEAL_API_KEY,
            'Content-Type': 'application/json'
          }
        });

        if (submittersResponse.ok) {
          const submittersData = await submittersResponse.json();
          console.log('🔍 Submitters response:', JSON.stringify(submittersData, null, 2));
          
          const firstSubmitter = submittersData.data?.[0];
          if (firstSubmitter) {
            signingUrl = firstSubmitter.embed_src || firstSubmitter.url || `${process.env.DOCUSEAL_URL}/s/${firstSubmitter.slug}`;
            console.log('🔗 Signing URL from submitters API:', signingUrl);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching submitters:', error);
      }
    }
    
    if (!signingUrl) {
      console.error('❌ No signing URL found in response');
      return NextResponse.json({ 
        error: 'No signing URL available',
        submission,
        debug: {
          isArray: Array.isArray(submission),
          hasSubmitters: !!submission.submitters,
          submittersLength: submission.submitters?.length || 0,
          firstSubmitter: submission.submitters?.[0] || null,
          submitterData
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      submissionId: submissionId,
      signingUrl: signingUrl,
      status: submitterData?.status || 'awaiting',
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName}`
    });

  } catch (error) {
    console.error('💥 Error creating in-person signing:', error);
    
    return NextResponse.json({ 
      error: 'Failed to create in-person signing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 