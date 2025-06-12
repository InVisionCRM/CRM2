import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function DELETE(req: Request) {
  console.log('🗑️ Deleting file from shared Google Drive');
  
  try {
    const { searchParams } = new URL(req.url);
    const driveFileId = searchParams.get('driveFileId');
    
    if (!driveFileId) {
      return NextResponse.json({ 
        error: 'Drive file ID is required' 
      }, { status: 400 });
    }

    // Use the same environment variables as contracts
    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY } = process.env;
    
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY) {
      console.error('❌ Google Service Account credentials not configured');
      return NextResponse.json({ 
        error: 'Google Service Account not configured' 
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

    console.log('🗑️ Deleting file from Google Drive:', driveFileId);

    // Delete from Google Drive
    await drive.files.delete({
      fileId: driveFileId,
      supportsAllDrives: true
    });

    console.log('✅ File deleted from Google Drive');

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting file from shared drive:', error);
    
    // Handle specific Google Drive errors
    if (error instanceof Error && error.message.includes('File not found')) {
      return NextResponse.json({ 
        error: 'File not found in Google Drive',
        details: error.message
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 