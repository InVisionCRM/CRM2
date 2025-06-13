import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  console.log('🔍 Checking if file exists in shared Google Drive');
  
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    const fileType = searchParams.get('fileType');
    
    console.log('📥 File existence check request:', { leadId, fileType });
    
    if (!leadId || !fileType) {
      console.error('❌ Missing parameters:', { leadId, fileType });
      return NextResponse.json({ 
        error: 'Lead ID and file type are required' 
      }, { status: 400 });
    }

    // Use the same environment variables as contracts
    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, SHARED_DRIVE_ID } = process.env;
    
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY) {
      console.error('❌ Google Service Account credentials not configured');
      return NextResponse.json({ 
        error: 'Google Service Account not configured',
        exists: false
      }, { status: 500 });
    }

    if (!SHARED_DRIVE_ID) {
      console.error('❌ SHARED_DRIVE_ID not configured');
      return NextResponse.json({ 
        error: 'Google Drive not configured',
        exists: false
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

    // Search for files with the specific fileType and leadId pattern
    // Files are named like: fileType/LeadName/leadId.extension
    const searchQuery = `name contains '${fileType}/' and name contains '/${leadId}.' and parents in '${SHARED_DRIVE_ID}' and trashed=false`;
    
    console.log('🔍 Searching Google Drive with query:', searchQuery);
    
    const response = await drive.files.list({
      q: searchQuery,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, webViewLink, appProperties)',
      pageSize: 1 // We only need to know if at least one exists
    });

    const files = response.data.files || [];
    const exists = files.length > 0;
    const fileUrl = exists ? files[0].webViewLink : null;
    const fileId = exists ? files[0].id : null;
    
    console.log(`📁 Search results:`, {
      query: searchQuery,
      filesFound: files.length,
      exists,
      fileUrl,
      fileId,
      files: files.map(f => ({ id: f.id, name: f.name, webViewLink: f.webViewLink, appProperties: f.appProperties }))
    });
    
    console.log(`📁 File exists check for ${fileType}/${leadId}: ${exists}`);
    if (exists) {
      console.log(`📄 Found file: ${files[0].name} at ${fileUrl} with ID ${fileId}`);
    }

    const responseData = {
      success: true,
      exists,
      fileType,
      leadId,
      fileUrl,
      fileId,
      searchQuery,
      filesFound: files.length
    };

    console.log('📤 Sending existence check response:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error checking file existence:', error);
    return NextResponse.json({ 
      error: 'Failed to check file existence',
      details: error instanceof Error ? error.message : 'Unknown error',
      exists: false
    }, { status: 500 });
  }
} 