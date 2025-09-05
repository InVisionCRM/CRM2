import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  console.log('📁 Creating folder in Google Drive');
  
  try {
    const { name, parentId } = await req.json();
    
    if (!name) {
      return NextResponse.json({ 
        success: false,
        message: 'Folder name is required'
      }, { status: 400 });
    }

    const folderId = parentId || process.env.SHARED_DRIVE_ID;
    
    if (!folderId) {
      return NextResponse.json({ 
        success: false,
        message: 'Parent folder ID is required'
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

    console.log(`📁 Creating folder: ${name} in parent: ${folderId}`);

    // Create folder in Google Drive
    const response = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name,
        parents: [folderId],
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, name, mimeType, webViewLink, createdTime'
    });

    const createdFolder = response.data;
    
    console.log(`✅ Successfully created folder: ${createdFolder.name} with ID: ${createdFolder.id}`);

    // Transform to match DriveFile interface
    const transformedFolder = {
      id: createdFolder.id!,
      name: createdFolder.name!,
      mimeType: createdFolder.mimeType!,
      webViewLink: createdFolder.webViewLink!,
      createdTime: createdFolder.createdTime!
    };

    return NextResponse.json({
      success: true,
      data: transformedFolder,
      message: 'Folder created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating folder in drive:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to create folder',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}