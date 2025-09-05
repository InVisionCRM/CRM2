import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';
import { Readable } from 'stream';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  console.warn('⚠️ DEPRECATED: /api/files/upload-to-shared-drive is deprecated. Use /api/files/upload-dual instead.');
  console.log('📁 Uploading file to shared Google Drive');
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('leadId') as string;
    const fileType = formData.get('fileType') as string; // 'file' or 'photo'
    const customFileName = formData.get('customFileName') as string; // New custom filename from LeadOverviewTab
    
    console.log('📥 Received upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      leadId,
      fileTypeParam: fileType,
      customFileName,
      hasCustomFileName: !!customFileName
    });
    
    if (!file || !leadId) {
      console.error('❌ Missing required fields:', { hasFile: !!file, leadId });
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
      console.error('❌ Lead not found:', leadId);
      return NextResponse.json({ 
        error: 'Lead not found' 
      }, { status: 404 });
    }

    console.log('👤 Found lead:', {
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName
    });

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
    let fileName: string;
    
    if (customFileName) {
      // Use the custom filename from LeadOverviewTab (format: fileType/LeadName/leadId.extension)
      fileName = customFileName;
      console.log('📝 Using custom filename:', fileName);
    } else {
      // Fallback to old naming convention for regular uploads
      const leadName = `${lead.firstName || 'Unknown'} ${lead.lastName || 'Lead'}`.trim();
      const fileExtension = file.name.split('.').pop() || '';
      const baseFileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const uploadDate = new Date().toLocaleDateString();
      
      const prefix = fileType === 'photo' ? 'Photo' : 'File';
      fileName = `${prefix} - ${leadName} (ID ${lead.id}) - ${baseFileName} - ${uploadDate}.${fileExtension}`;
      console.log('📝 Using fallback filename:', fileName);
    }
    
    console.log('⬆️ Uploading to Shared Drive:', fileName);

    // Log the metadata that will be stored
    const metadata = {
      leadId: leadId,
      fileType: fileType,
      originalName: file.name,
      uploadedBy: 'leadOverviewTab'
    };
    console.log('🏷️ Storing metadata:', metadata);

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
        mimeType: file.type,
        appProperties: metadata
      },
      media: {
        mimeType: file.type,
        body: stream
      },
      fields: 'id,webViewLink,webContentLink,thumbnailLink,appProperties',
      supportsAllDrives: true // Required for shared drives
    });

    const driveFileId = driveResult.data.id;
    const webViewLink = driveResult.data.webViewLink;
    const webContentLink = driveResult.data.webContentLink;
    const thumbnailLink = driveResult.data.thumbnailLink;

    console.log('📤 Google Drive response:', {
      driveFileId,
      webViewLink,
      webContentLink,
      thumbnailLink,
      appProperties: driveResult.data.appProperties
    });

    if (!driveFileId || !webViewLink) {
      throw new Error('Failed to upload file to Shared Drive');
    }

    console.log('✅ File uploaded to Shared Drive:', driveFileId);

    // Also upload to Vercel Blob for better performance
    let blobUrl: string | null = null;
    try {
      console.log('📤 Also uploading to Vercel Blob...');
      const uniqueId = nanoid();
      const extension = file.name.split('.').pop() || 'bin';
      const blobFileName = `${uniqueId}.${extension}`;
      const blobPath = `leads/${leadId}/${fileType || 'files'}/${blobFileName}`;

      const { url } = await put(blobPath, file, {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
      });
      
      blobUrl = url;
      console.log('✅ File also uploaded to Vercel Blob:', blobUrl);
    } catch (blobError) {
      console.warn('⚠️ Vercel Blob upload failed, continuing with Drive only:', blobError);
    }

    // Create database record for the uploaded file with dual storage
    try {
      const fileRecord = await prisma.file.create({
        data: {
          url: blobUrl || webViewLink, // Prefer Blob URL if available
          name: fileName,
          size: file.size,
          type: file.type,
          category: fileType,
          leadId: leadId,
          blobUrl,
          driveFileId,
          storageLocation: blobUrl ? 'both' : 'drive'
        }
      });
      console.log('📝 Created database record for file with dual storage:', fileRecord.id);
    } catch (dbError) {
      console.error('⚠️ Failed to create database record, but file was uploaded to Drive:', dbError);
      // Don't fail the entire upload if database creation fails
    }

    const responseData = {
      success: true,
      file: {
        id: driveFileId, // Use drive file ID as the main ID
        name: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: blobUrl || webViewLink, // Return Blob URL as primary if available
        blobUrl,
        driveUrl: webViewLink,
        webContentLink,
        thumbnailLink,
        driveFileId,
        fileType: fileType, // Include fileType in response
        storageLocation: blobUrl ? 'both' : 'drive',
        uploadedAt: new Date()
      }
    };

    console.log('📤 Sending response:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error uploading file to shared drive:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 