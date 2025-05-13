import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/lib/services/googleDrive";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;
    
    if (!file || !folderId) {
      return NextResponse.json({ success: false, message: "Missing file or folder ID" }, { status: 400 });
    }
    
    const driveService = new GoogleDriveService({ accessToken: session.accessToken });
    const uploadResult = await driveService.uploadFile(file, { folderId });
    
    if (uploadResult.success) {
      return NextResponse.json({ 
        success: true, 
        file: uploadResult.data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: uploadResult.message || "Failed to upload file to Drive" 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("Error in upload-drive-file API:", error);
    return NextResponse.json({ 
      success: false,
      message: error.message || "An unexpected error occurred"  
    }, { status: 500 });
  }
}
