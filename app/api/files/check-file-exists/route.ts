import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  console.log('🔍 Checking if file exists (database + Google Drive)');
  
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

    // First, check the database for files with matching category
    console.log('🗃️ Checking database for files...');
    const dbFiles = await prisma.file.findMany({
      where: { 
        leadId,
        OR: [
          { category: fileType },
          { category: { contains: fileType } },
          { name: { contains: fileType } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (dbFiles.length > 0) {
      const dbFile = dbFiles[0];
      console.log('✅ Found file in database:', dbFile.name);
      
      return NextResponse.json({
        success: true,
        exists: true,
        fileType,
        leadId,
        fileUrl: dbFile.url,
        fileId: dbFile.driveFileId || dbFile.id,
        source: 'database',
        fileName: dbFile.name
      });
    }

    console.log('📁 No files found in database, checking Google Drive...');

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

    // Search for files associated with this lead
    // Files can be named in multiple patterns:
    // 1. Custom filename: fileType/LeadName/leadId.extension
    // 2. Fallback pattern: "File - FirstName LastName (ID leadId) - filename - date.extension"  
    // 3. Or files stored with leadId in appProperties
    const searchQuery = `(name contains '${leadId}' or appProperties has { key='leadId' and value='${leadId}' }) and parents in '${SHARED_DRIVE_ID}' and trashed=false`;
    
    console.log('🔍 Searching Google Drive with query:', searchQuery);
    
    const response = await drive.files.list({
      q: searchQuery,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, webViewLink, appProperties, createdTime, mimeType)',
      orderBy: 'createdTime desc', // Get the most recent file first
      pageSize: 5 // Get a few files to analyze
    });

    const files = response.data.files || [];
    let bestMatch = null;
    
    if (files.length > 0) {
      // Find the best match with different priority levels:
      // 1. Files with leadId in appProperties and matching fileType
      const metadataMatch = files.find(file => 
        file.appProperties?.leadId === leadId && 
        file.appProperties?.fileType === fileType
      );
      
      // 2. Files with custom filename pattern: fileType/LeadName/leadId.extension
      const customMatch = files.find(file => 
        file.name?.includes(`${fileType}/`) && 
        file.name?.includes(`/${leadId}.`)
      );
      
      // 3. Files with fallback pattern containing leadId and fileType context
      const fallbackMatch = files.find(file => 
        file.name?.includes(leadId) && 
        (file.name?.includes('File -') || file.name?.includes('Photo -'))
      );
      
      // Use the best available match
      bestMatch = metadataMatch || customMatch || fallbackMatch || files[0];
    }
    
    const exists = !!bestMatch;
    const fileUrl = bestMatch?.webViewLink || null;
    const fileId = bestMatch?.id || null;
    
    console.log(`📁 Search results:`, {
      query: searchQuery,
      filesFound: files.length,
      exists,
      fileUrl,
      fileId,
      bestMatchName: bestMatch?.name,
      allFiles: files.map(f => ({ id: f.id, name: f.name, createdTime: f.createdTime, webViewLink: f.webViewLink }))
    });
    
    console.log(`📁 File exists check for ${fileType}/${leadId}: ${exists}`);
    if (exists && bestMatch) {
      console.log(`📄 Found best match: ${bestMatch.name} at ${fileUrl} with ID ${fileId}`);
    }

    const responseData = {
      success: true,
      exists,
      fileType,
      leadId,
      fileUrl,
      fileId,
      searchQuery,
      filesFound: files.length,
      source: 'google-drive',
      fileName: bestMatch?.name
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