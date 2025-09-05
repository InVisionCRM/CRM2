import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  console.log('📋 Listing files from Google Drive folder');
  
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId') || process.env.SHARED_DRIVE_ID;
    const mimeTypes = searchParams.get('mimeTypes');
    
    if (!folderId) {
      return NextResponse.json({ 
        success: false,
        message: 'Folder ID is required',
        data: []
      }, { status: 400 });
    }

    // Use the same environment variables as other drive operations
    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, SHARED_DRIVE_ID } = process.env;
    
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY) {
      console.error('❌ Google Service Account credentials not configured');
      return NextResponse.json({ 
        success: false,
        message: 'Google Service Account not configured',
        data: []
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

    // Build query for listing files in folder
    let q = `'${folderId}' in parents and trashed=false`;
    
    // Add mime type filters if specified
    if (mimeTypes) {
      const mimeTypeArray = mimeTypes.split(',').filter(Boolean);
      if (mimeTypeArray.length > 0) {
        q += ` and (${mimeTypeArray.map(mt => `mimeType='${mt.trim()}'`).join(" or ")})`;
      }
    }
    
    console.log('🔍 Searching Google Drive with query:', q);
    
    const response = await drive.files.list({
      q,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink, parents)',
      orderBy: 'modifiedTime desc', // Most recent first
      pageSize: 100
    });

    const files = response.data.files || [];
    
    console.log(`📁 Found ${files.length} files in folder ${folderId}`);

    // Transform files to match DriveFile interface
    const transformedFiles = files.map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      webViewLink: file.webViewLink!,
      createdTime: file.createdTime!,
      modifiedTime: file.modifiedTime,
      size: file.size ? parseInt(file.size) : undefined,
      webContentLink: file.webContentLink,
      thumbnailLink: file.thumbnailLink,
      iconLink: file.iconLink,
      parents: file.parents
    }));

    return NextResponse.json({
      success: true,
      data: transformedFiles,
      message: `Found ${transformedFiles.length} files`
    });

  } catch (error) {
    console.error('❌ Error listing files from drive folder:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to list files',
      data: [],
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}