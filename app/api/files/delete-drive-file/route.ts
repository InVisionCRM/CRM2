import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function DELETE(req: NextRequest) {
  console.log('🗑️ Deleting file from Google Drive');
  
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json({ 
        success: false,
        message: 'File ID is required'
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

    console.log(`🗑️ Deleting file with ID: ${fileId}`);

    // Delete file from Google Drive (moves to trash)
    await drive.files.delete({
      fileId,
      supportsAllDrives: true
    });
    
    console.log(`✅ Successfully deleted file: ${fileId}`);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting file from drive:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}