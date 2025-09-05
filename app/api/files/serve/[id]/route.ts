import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 Serving file: ${id}`);

    // Get file record from database
    const fileRecord = await prisma.file.findUnique({
      where: { id }
    });

    if (!fileRecord) {
      console.error(`❌ File not found: ${id}`);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Determine the best URL to serve
    let fileUrl: string;
    let redirectType = 'temporary'; // 302 by default

    if (fileRecord.blobUrl) {
      // Prefer Vercel Blob URL (fastest, CDN)
      fileUrl = fileRecord.blobUrl;
      redirectType = 'permanent'; // 301 for cached CDN URLs
      console.log(`📦 Serving from Vercel Blob: ${fileUrl}`);
    } else if (fileRecord.url) {
      // Fallback to Drive URL
      fileUrl = fileRecord.url;
      console.log(`🗂️ Serving from Google Drive: ${fileUrl}`);
    } else {
      console.error(`❌ No valid URL found for file: ${id}`);
      return NextResponse.json(
        { error: 'File URL not available' },
        { status: 500 }
      );
    }

    // For API clients, return JSON with file info
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('application/json')) {
      return NextResponse.json({
        success: true,
        data: {
          id: fileRecord.id,
          name: fileRecord.name,
          url: fileUrl,
          blobUrl: fileRecord.blobUrl,
          driveUrl: fileRecord.url !== fileRecord.blobUrl ? fileRecord.url : null,
          size: fileRecord.size,
          type: fileRecord.type,
          category: fileRecord.category,
          storageLocation: fileRecord.storageLocation,
          createdAt: fileRecord.createdAt
        }
      });
    }

    // For direct file access, redirect to the file
    const status = redirectType === 'permanent' ? 301 : 302;
    return NextResponse.redirect(fileUrl, status);

  } catch (error) {
    console.error('❌ Error serving file:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}