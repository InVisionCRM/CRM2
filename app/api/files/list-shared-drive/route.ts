import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  console.log('📋 Listing files from shared Google Drive');
  
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    
    if (!leadId) {
      return NextResponse.json({ 
        error: 'Lead ID is required' 
      }, { status: 400 });
    }

    // Use the same environment variables as contracts
    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, SHARED_DRIVE_ID } = process.env;
    
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY) {
      console.error('❌ Google Service Account credentials not configured');
      return NextResponse.json({ 
        error: 'Google Service Account not configured',
        files: []
      }, { status: 500 });
    }

    if (!SHARED_DRIVE_ID) {
      console.error('❌ SHARED_DRIVE_ID not configured');
      return NextResponse.json({ 
        error: 'Google Drive not configured',
        files: []
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

    // Search for files containing the lead ID in the name (excluding contracts)
    // We exclude contracts since they have their own management system
    const searchQuery = `name contains 'ID ${leadId}' and parents in '${SHARED_DRIVE_ID}' and trashed=false and not name contains 'Signed Contract'`;
    
    console.log('🔍 Searching Google Drive with query:', searchQuery);
    
    const response = await drive.files.list({
      q: searchQuery,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, iconLink)',
      orderBy: 'modifiedTime desc' // Most recent first
    });

    const files = response.data.files || [];
    
    console.log(`📁 Found ${files.length} files for lead ${leadId}`);

    // Transform files to match expected format
    const transformedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size) : undefined,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      thumbnailLink: file.thumbnailLink,
      iconLink: file.iconLink,
      source: 'shared-drive' as const,
      // Determine if it's a photo or file based on filename prefix
      fileType: file.name?.startsWith('Photo -') ? 'photo' : 'file'
    }));

    return NextResponse.json({
      success: true,
      files: transformedFiles,
      count: transformedFiles.length
    });

  } catch (error) {
    console.error('❌ Error listing files from shared drive:', error);
    return NextResponse.json({ 
      error: 'Failed to list files',
      details: error instanceof Error ? error.message : 'Unknown error',
      files: []
    }, { status: 500 });
  }
} 