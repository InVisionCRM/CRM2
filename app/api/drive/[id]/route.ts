import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjusted path
import { GoogleDriveService } from "@/lib/services/googleDrive";

async function getServiceInstance() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    throw new Error("Authentication required: No access token found.");
  }
  return new GoogleDriveService({ accessToken: session.accessToken });
}

// GET /api/drive/[id] - Downloads a file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    if (!fileId) {
      return NextResponse.json(
        { success: false, message: "File ID is required" },
        { status: 400 }
      );
    }

    const service = await getServiceInstance();
    const result = await service.downloadFile(fileId);

    if (result.success && result.data) {
      // Determine content type - this is a simplistic approach
      // For a robust solution, you might want to fetch file metadata first
      // or store it alongside the ID if you know the file type.
      // For now, we default to application/octet-stream for direct download.
      // const fileMetadata = await service.getFileMetadata(fileId); // Hypothetical method
      // const mimeType = fileMetadata.data?.mimeType || "application/octet-stream";
 
      return new NextResponse(result.data, {
        status: 200,
        headers: {
          // 'Content-Type': mimeType, 
          'Content-Type': "application/octet-stream", // Fallback
          // 'Content-Disposition': `attachment; filename="${fileName || fileId}"`, // Requires filename
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message || "Failed to download file" },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(`GET /api/drive/[id] error: ${message}`);
    const status = message.startsWith("Authentication required") ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// DELETE /api/drive/[id] - Deletes a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    if (!fileId) {
      return NextResponse.json(
        { success: false, message: "File ID is required" },
        { status: 400 }
      );
    }

    const service = await getServiceInstance();
    const result = await service.deleteFile(fileId);

    if (result.success) {
      return NextResponse.json({ success: true, data: null }, { status: 200 }); // Or 204 No Content
    } else {
      return NextResponse.json(
        { success: false, message: result.message || "Failed to delete file" },
        { status: 500 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error(`DELETE /api/drive/[id] error: ${message}`);
    const status = message.startsWith("Authentication required") ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
} 