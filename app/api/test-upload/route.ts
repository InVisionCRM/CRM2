import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"

export const config = {
  api: {
    bodyParser: false
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[TEST UPLOAD] Received file upload request");
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    console.log("[TEST UPLOAD] File details:", {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Create directory
    const uploadsDir = join(process.cwd(), "public", "uploads", "test");
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log("[TEST UPLOAD] Directory created or exists:", uploadsDir);
    } catch (error) {
      console.error("[TEST UPLOAD] Directory error:", error);
    }
    
    // Save file
    const filename = `test-${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, filename);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    console.log("[TEST UPLOAD] File saved to:", filePath);
    
    return NextResponse.json({ 
      success: true,
      filename: filename,
      url: `/uploads/test/${filename}`,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error("[TEST UPLOAD] Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Upload failed",
      details: error instanceof Error ? error.stack : "Unknown error"
    }, { status: 500 });
  }
} 