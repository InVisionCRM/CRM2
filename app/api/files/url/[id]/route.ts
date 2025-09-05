import { NextRequest, NextResponse } from 'next/server';
import { DualFileStorageService } from '@/lib/services/dualFileStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'view'; // 'view' or 'download'

    console.log(`🔗 Getting ${type} URL for file: ${id}`);

    const storageService = new DualFileStorageService();
    
    let url: string | null;
    if (type === 'download') {
      url = await storageService.getDownloadUrl(id);
    } else {
      url = await storageService.getFileUrl(id);
    }

    if (!url) {
      return NextResponse.json(
        { error: 'File not found or URL not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
      type
    });

  } catch (error) {
    console.error('❌ Error getting file URL:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}