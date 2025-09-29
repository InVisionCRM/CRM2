import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjusted path
import { GoogleDriveService } from "@/lib/services/googleDrive";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getServiceInstance() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    throw new Error("Authentication required: No access token found.");
  }
  return new GoogleDriveService({ accessToken: session.accessToken });
}

// GET /api/drive/[id] - Get file by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get file details from database
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error('Error fetching file:', error)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}

// DELETE /api/drive/[id] - Delete file
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const service = await getServiceInstance();
    const result = await service.deleteFile(id);

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