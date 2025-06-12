import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: Request) {
  console.log('🔍 Checking if contract exists in Google Drive');
  
  try {
    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('submissionId');
    const leadId = searchParams.get('leadId');
    
    if (!submissionId && !leadId) {
      return NextResponse.json({ 
        error: 'Either submissionId or leadId is required' 
      }, { status: 400 });
    }

    // Use the same environment variables as the rest of the codebase
    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, SHARED_DRIVE_ID } = process.env;
    
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY) {
      console.error('❌ Google Service Account credentials not configured');
      return NextResponse.json({ 
        error: 'Google Service Account not configured',
        exists: false // Default to false so dialog shows
      }, { status: 500 });
    }

    if (!SHARED_DRIVE_ID) {
      console.error('❌ SHARED_DRIVE_ID not configured');
      return NextResponse.json({ 
        error: 'Google Drive not configured',
        exists: false // Default to false so dialog shows
      }, { status: 500 });
    }

    // Create credentials object in the same format as other APIs
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

    // Search for files based on the filename format used in webhook
    // Filename format: "Signed Contract - {leadName} (ID {lead.id}) - {template.name} - {date}.pdf"
    let searchQuery;
    if (leadId) {
      // Search by lead ID (more reliable since it's in the filename)
      searchQuery = `name contains 'ID ${leadId}' and parents in '${SHARED_DRIVE_ID}' and trashed=false and name contains 'Signed Contract'`;
      console.log('🔍 Searching Google Drive by lead ID:', leadId);
    } else {
      // Fallback to submission ID search (less reliable)
      searchQuery = `name contains 'ID ${submissionId}' and parents in '${SHARED_DRIVE_ID}' and trashed=false`;
      console.log('🔍 Searching Google Drive by submission ID:', submissionId);
    }
    
    console.log('🔍 Search query:', searchQuery);
    
    const response = await drive.files.list({
      q: searchQuery,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, createdTime)',
    });

    const files = response.data.files || [];
    const exists = files.length > 0;
    
    console.log(`${exists ? '✅' : '❌'} Contract ${exists ? 'found' : 'not found'} in Google Drive:`, {
      searchBy: leadId ? 'leadId' : 'submissionId',
      searchValue: leadId || submissionId,
      filesFound: files.length,
      files: files.map(f => ({ name: f.name, id: f.id }))
    });

    return NextResponse.json({
      exists,
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        createdTime: file.createdTime
      }))
    });

  } catch (error) {
    console.error('❌ Error checking contract in Google Drive:', error);
    return NextResponse.json({ 
      error: 'Failed to check Google Drive',
      exists: false, // Default to false so dialog shows if check fails
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 