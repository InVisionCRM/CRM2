import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  console.log('📤 Uploading file to Google Drive folder');
  
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string || process.env.SHARED_DRIVE_ID;
    
    if (!file) {
      return NextResponse.json({ 
        success: false,
        message: 'File is required'
      }, { status: 400 });
    }

    if (!folderId) {
      return NextResponse.json({ 
        success: false,
        message: 'Folder ID is required'
      }, { status: 400 });
    }

    // Use the same environment variables as other drive operations
    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY } = process.env;
    
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY) {
      console.error('❌ Google Service Account credentials not configured');
      return NextResponse.json({ 
        success: false,
        message: 'Google Service Account not configured'
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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`📤 Uploading file: ${file.name} to folder: ${folderId}`);

    // Upload file to Google Drive
    const response = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: file.name,
        parents: [folderId],
        mimeType: file.type,
      },
      media: {
        mimeType: file.type,
        body: buffer,
      },
      fields: 'id, name, mimeType, webViewLink, createdTime, size'
    });

    const uploadedFile = response.data;
    
    console.log(`✅ Successfully uploaded file: ${uploadedFile.name} with ID: ${uploadedFile.id}`);

    // Transform to match DriveFile interface
    const transformedFile = {
      id: uploadedFile.id!,
      name: uploadedFile.name!,
      mimeType: uploadedFile.mimeType!,
      webViewLink: uploadedFile.webViewLink!,
      createdTime: uploadedFile.createdTime!,
      size: uploadedFile.size ? parseInt(uploadedFile.size) : undefined
    };

    return NextResponse.json({
      success: true,
      data: transformedFile,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Error uploading file to drive folder:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}