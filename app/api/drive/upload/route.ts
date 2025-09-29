import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjusted path
import { GoogleDriveService } from "@/lib/services/googleDrive";
import { DriveFile } from "@/types/drive";

async function getServiceInstance() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    throw new Error("Authentication required: No access token found.");
  }
  return new GoogleDriveService({ accessToken: session.accessToken });
}

// POST /api/drive/upload - Uploads a file
export async function POST(request: NextRequest) {
  try {
    const service = await getServiceInstance();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File is required" },
        { status: 400 }
      );
    }

    const result = await service.uploadFile(file, { 
      folderId: folderId || undefined 
    });

    if (result.success && result.data) {
      return NextResponse.json<{
        success: true;
        data: DriveFile;
        message?: string;
      }>({ success: true, data: result.data }, { status: 201 });
    } else {
      return NextResponse.json(
        { success: false, message: result.message || "Failed to upload file" },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(`POST /api/drive/upload error: ${message}`);
    const status = message.startsWith("Authentication required") ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
} 