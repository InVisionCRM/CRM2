import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma'; // Assuming alias is configured
import { z } from 'zod';
import { format } from 'date-fns';

const cloneContractSchema = z.object({
  leadId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = cloneContractSchema.safeParse(body);

    if (!validation.success) {
      console.error("Zod validation failed:", validation.error.errors);
      return NextResponse.json({ message: 'Invalid request body', errors: validation.error.errors }, { status: 400 });
    }

    const { leadId } = validation.data;

    // 1. Fetch Lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, GOOGLE_CONTRACT_TEMPLATE_ID, SHARED_DRIVE_ID } = process.env;

    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY || !GOOGLE_CONTRACT_TEMPLATE_ID || !SHARED_DRIVE_ID) {
        console.error('Missing Google API environment variables. Ensure GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, GOOGLE_CONTRACT_TEMPLATE_ID, and SHARED_DRIVE_ID are set.');
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }
    
    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SA_EMAIL,
        private_key: GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
      ],
    });

    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    // 2. Copy template into Shared Drive
    const copiedFile = await drive.files.copy({
      fileId: GOOGLE_CONTRACT_TEMPLATE_ID,
      requestBody: {
        name: `${lead.firstName ?? ''} ${lead.lastName ?? ''} - In-Vision Construction Standard Agreement - ${format(new Date(), 'MM-dd-yyyy')}`,
        parents: [SHARED_DRIVE_ID],
      },
      supportsAllDrives: true,
      driveId: SHARED_DRIVE_ID,
      fields: 'id, webViewLink',
    } as any);

    const documentId = copiedFile.data.id;
    const webViewLink = copiedFile.data.webViewLink;

    if (!documentId || !webViewLink) {
        throw new Error('Failed to copy the template or get its URL.');
    }

    // 3. Replace placeholders
    const requests = [
      {
        replaceAllText: {
          containsText: { text: '{{CLIENT_NAME}}', matchCase: true },
          replaceText: `${lead.firstName ?? ''} ${lead.lastName ?? ''}`,
        },
      },
      {
        replaceAllText: {
          containsText: { text: '{{TODAY}}', matchCase: true },
          replaceText: format(new Date(), 'MM/dd/yyyy'),
        },
      },
      {
        replaceAllText: {
          containsText: { text: '{{BILLING_ADDRESS}}', matchCase: true },
          replaceText: lead.address ?? '',
        },
      },
      {
        replaceAllText: {
          containsText: { text: '{{PROJECT_ADDRESS}}', matchCase: true },
          replaceText: lead.address ?? '',
        },
      },
      {
        replaceAllText: {
          containsText: { text: '{{CLIENT_PHONE}}', matchCase: true },
          replaceText: lead.phone ?? '',
        },
      },
      {
        replaceAllText: {
          containsText: { text: '{{CLIENT_EMAIL}}', matchCase: true },
          replaceText: lead.email ?? '',
        },
      },
    ];

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests,
      },
    });
    
    // 4. Respond with the webViewLink from the copy operation
    return NextResponse.json({ url: webViewLink });

  } catch (error) {
    console.error('Error cloning contract:', error);
    let errorMessage = 'An internal server error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Failed to create contract', error: errorMessage }, { status: 500 });
  }
} 