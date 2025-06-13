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

    try {
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

    } catch (driveError: any) {
      // Handle Google Drive API specific errors
      if (driveError.code === 404 || driveError.status === 404) {
        console.log('📝 File not found in Google Drive (already deleted), treating as success');
        return NextResponse.json({
          success: true,
          message: 'File not found (already deleted)'
        });
      }
      
      // Re-throw other Google Drive errors
      throw driveError;
    }

  } catch (error: any) {
    console.error('❌ Error deleting file from shared drive:', error);
    
    // Handle specific Google Drive errors that might not be caught above
    if (error.code === 404 || error.status === 404 || 
        (error.message && error.message.includes('File not found'))) {
      console.log('📝 File not found in Google Drive (fallback check), treating as success');
      return NextResponse.json({
        success: true,
        message: 'File not found (already deleted)'
      });
    }

    return NextResponse.json({ 
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 