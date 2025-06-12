import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import { Readable } from 'stream';

export async function POST(req: Request) {
  console.log('📁 Uploading file to shared Google Drive');
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('leadId') as string;
    const fileType = formData.get('fileType') as string; // 'file' or 'photo'
    
    if (!file || !leadId) {
      return NextResponse.json({ 
        error: 'File and lead ID are required' 
      }, { status: 400 });
    }

    // Get lead information for filename
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });

    if (!lead) {
      return NextResponse.json({ 
        error: 'Lead not found' 
      }, { status: 404 });
    }

    // Use the same environment variables as contracts
    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, SHARED_DRIVE_ID } = process.env;
    
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY) {
      console.error('❌ Google Service Account credentials not configured');
      return NextResponse.json({ 
        error: 'Google Service Account not configured' 
      }, { status: 500 });
    }

    if (!SHARED_DRIVE_ID) {
      console.error('❌ SHARED_DRIVE_ID not configured');
      return NextResponse.json({ 
        error: 'Google Drive not configured' 
      }, { status: 500 });
    }

    // Create credentials object
    const credentials = {
      type: 'service_account',
      client_email: GOOGLE_SA_EMAIL,
      private_key: GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Create filename with lead information (similar to contracts)
    const leadName = `${lead.firstName || 'Unknown'} ${lead.lastName || 'Lead'}`.trim();
    const fileExtension = file.name.split('.').pop() || '';
    const baseFileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const uploadDate = new Date().toLocaleDateString();
    
    const prefix = fileType === 'photo' ? 'Photo' : 'File';
    const fileName = `${prefix} - ${leadName} (ID ${lead.id}) - ${baseFileName} - ${uploadDate}.${fileExtension}`;
    
    console.log('⬆️ Uploading to Shared Drive:', fileName);

    // Convert file to buffer and create readable stream
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null); // End the stream
    
    // Upload to Google Drive
    const driveResult = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [SHARED_DRIVE_ID],
        mimeType: file.type
      },
      media: {
        mimeType: file.type,
        body: stream
      },
      fields: 'id,webViewLink,webContentLink,thumbnailLink',
      supportsAllDrives: true // Required for shared drives
    });

    const driveFileId = driveResult.data.id;
    const webViewLink = driveResult.data.webViewLink;
    const webContentLink = driveResult.data.webContentLink;
    const thumbnailLink = driveResult.data.thumbnailLink;

    if (!driveFileId || !webViewLink) {
      throw new Error('Failed to upload file to Shared Drive');
    }

    console.log('✅ File uploaded to Shared Drive:', driveFileId);

    return NextResponse.json({
      success: true,
      file: {
        id: driveFileId, // Use drive file ID as the main ID
        name: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: webViewLink,
        webContentLink,
        thumbnailLink,
        driveFileId,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error uploading file to shared drive:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 