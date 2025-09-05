import { NextRequest, NextResponse } from 'next/server';
import { DualFileStorageService } from '@/lib/services/dualFileStorage';

export async function POST(request: NextRequest) {
  console.log('📤 Dual storage upload request received');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('leadId') as string;
    const fileType = formData.get('fileType') as string;
    const category = formData.get('category') as string;
    const customFileName = formData.get('customFileName') as string;
    const description = formData.get('description') as string;

    console.log('📥 Upload parameters:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      leadId,
      fileTypeParam: fileType,
      category,
      hasCustomFileName: !!customFileName
    });

    if (!file || !leadId) {
      console.error('❌ Missing required fields:', { hasFile: !!file, leadId });
      return NextResponse.json({
        success: false,
        message: 'File and lead ID are required'
      }, { status: 400 });
    }

    // Initialize dual storage service
    const storageService = new DualFileStorageService();

    // Upload to both storages
    const result = await storageService.uploadFile(file, {
      leadId,
      fileType,
      category,
      customFileName,
      description
    });

    if (result.success) {
      console.log('✅ Dual upload successful:', result.data?.id);
      return NextResponse.json(result);
    } else {
      console.error('❌ Dual upload failed:', result.message);
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Dual upload endpoint error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}