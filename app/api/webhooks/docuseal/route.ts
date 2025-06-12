import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { google } from 'googleapis';
import { Readable } from 'stream';

interface DocuSealWebhookSubmission {
  event_type: 'submission.completed';
  timestamp: string;
  data: {
    id: number;
    name: string | null;
    slug: string;
    status: 'completed';
    audit_log_url: string | null;
    combined_document_url: string | null;
    completed_at: string;
    submitters: Array<{
      id: number;
      email: string;
      name: string;
      completed_at: string;
      status: 'completed';
    }>;
    template: {
      id: number;
      name: string;
      folder_name: string;
    };
  };
}

export async function POST(req: Request) {
  console.log('🔵 DocuSeal webhook received');
  
  try {
    const payload: DocuSealWebhookSubmission = await req.json();
    
    // Only process completed submissions
    if (payload.event_type !== 'submission.completed' || payload.data.status !== 'completed') {
      console.log('⏭️ Ignoring non-completion webhook');
      return NextResponse.json({ success: true, message: 'Ignored non-completion event' });
    }

    console.log('📋 Processing completed submission:', {
      id: payload.data.id,
      submitters: payload.data.submitters.map(s => s.email),
      template: payload.data.template.name
    });

    // Find lead by submitter email
    const submitterEmails = payload.data.submitters.map(s => s.email.toLowerCase());
    const lead = await prisma.lead.findFirst({
      where: {
        email: {
          in: submitterEmails,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        googleDriveFolderId: true
      }
    });

    if (!lead) {
      console.log('⚠️ No lead found for submitter emails:', submitterEmails);
      return NextResponse.json({ 
        success: false, 
        message: 'No matching lead found for submitter emails' 
      });
    }

    console.log('✅ Found matching lead:', lead.id, lead.email);

    // Use shared drive directly instead of lead-specific folders
    const sharedDriveId = process.env.SHARED_DRIVE_ID;
    if (!sharedDriveId) {
      throw new Error('SHARED_DRIVE_ID environment variable is required');
    }

    console.log('📁 Using shared drive for contract storage:', sharedDriveId);

    // Download and save the signed contract
    const contractUrl = await saveSignedContractToLead(
      payload.data,
      lead,
      sharedDriveId // Use shared drive ID directly
    );

    if (contractUrl) {
      // Save contract record in database
      await prisma.contract.create({
        data: {
          leadId: lead.id,
          contractType: 'docuseal_signed',
          signatures: { submissionId: payload.data.id },
          dates: { completedAt: payload.data.completed_at },
          names: { 
            submitters: payload.data.submitters.map(s => s.name).join(', '),
            template: payload.data.template.name
          },
          addresses: {},
          contactInfo: {
            submitterEmails: submitterEmails
          },
          pdfUrl: contractUrl
        }
      });

      console.log('✅ Signed contract saved successfully for lead:', lead.id);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Signed contract saved to lead successfully',
        leadId: lead.id,
        contractUrl
      });
    } else {
      throw new Error('Failed to save signed contract');
    }

  } catch (error) {
    console.error('💥 Error processing DocuSeal webhook:', error);
    
    return NextResponse.json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function saveSignedContractToLead(
  submission: DocuSealWebhookSubmission['data'],
  lead: { id: string; firstName: string | null; lastName: string | null },
  sharedDriveId: string
): Promise<string | null> {
  try {
    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, DOCUSEAL_URL, DOCUSEAL_API_KEY } = process.env;
    
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY || !DOCUSEAL_URL || !DOCUSEAL_API_KEY) {
      throw new Error('Missing configuration for contract download/upload');
    }

    // First, try to get the signed document from DocuSeal
    let documentUrl: string | null = null;
    let documentBuffer: Buffer | null = null;

    // Try combined document URL first
    if (submission.combined_document_url) {
      console.log('📄 Downloading from combined_document_url');
      documentUrl = submission.combined_document_url;
    } else {
      // Get detailed submission info to find documents (same approach as UI)
      console.log('📄 Fetching detailed submission info from DocuSeal API');
      const detailsResponse = await fetch(
        `${DOCUSEAL_URL}/api/submissions/${submission.id}`,
        {
          headers: {
            'X-Auth-Token': DOCUSEAL_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        console.log('📋 Detailed submission info received, checking for documents');
        
        // Check if documents are embedded in the submission details
        if (details.documents && details.documents.length > 0) {
          console.log('✅ Found documents in submission details:', details.documents.length);
          documentUrl = details.documents[0].url;
        } else {
          console.log('⚠️ No documents found in submission details, trying documents endpoint');
          
          // Fallback to documents endpoint
          const documentsResponse = await fetch(
            `${DOCUSEAL_URL}/api/submissions/${submission.id}/documents`,
            {
              headers: {
                'X-Auth-Token': DOCUSEAL_API_KEY,
                'Content-Type': 'application/json'
              }
            }
          );

          if (documentsResponse.ok) {
            const documents = await documentsResponse.json();
            if (documents && documents.length > 0) {
              documentUrl = documents[0].url;
            }
          }
        }
      }
    }

    if (!documentUrl) {
      throw new Error('No document URL available from DocuSeal');
    }

    // Download the document
    console.log('⬇️ Downloading signed contract from:', documentUrl);
    const downloadResponse = await fetch(documentUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download contract: ${downloadResponse.statusText}`);
    }

    documentBuffer = Buffer.from(await downloadResponse.arrayBuffer());
    console.log('✅ Contract downloaded, size:', documentBuffer.length, 'bytes');

    // Upload to Google Drive Shared Drive
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SA_EMAIL,
        private_key: GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });
    
    // Include lead information in filename since we're not using separate folders
    const leadName = `${lead.firstName || 'Unknown'} ${lead.lastName || 'Lead'}`.trim();
    const fileName = `Signed Contract - ${leadName} (ID ${lead.id}) - ${submission.template.name} - ${new Date(submission.completed_at).toLocaleDateString()}.pdf`;
    
    console.log('⬆️ Uploading to Shared Drive:', fileName);
    
    // Create a readable stream from the buffer for Google Drive API
    const stream = new Readable();
    stream.push(documentBuffer);
    stream.push(null); // End the stream
    
    const driveResult = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [sharedDriveId],
        mimeType: 'application/pdf'
      },
      media: {
        mimeType: 'application/pdf',
        body: stream
      },
      fields: 'id,webViewLink',
      supportsAllDrives: true // Required for shared drives
    });

    const driveFileId = driveResult.data.id;
    const webViewLink = driveResult.data.webViewLink;

    if (!driveFileId || !webViewLink) {
      throw new Error('Failed to upload contract to Shared Drive');
    }

    console.log('✅ Contract uploaded to Shared Drive:', driveFileId);
    return webViewLink;

  } catch (error) {
    console.error('Error saving signed contract to shared drive:', error);
    return null;
  }
} 