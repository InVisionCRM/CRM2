import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"

// Enable more detailed logging for debugging
const DEBUG = true;
const logDebug = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[PROFILE API] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Validate if the file is a valid image
const isValidImage = (contentType: string): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(contentType);
};

// Validate file size
const isValidFileSize = (size: number, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

// Generate a unique filename
const generateUniqueFilename = (userId: string, originalFilename: string): string => {
  const fileExt = originalFilename.split('.').pop() || 'jpg';
  return `${userId}-${Date.now()}.${fileExt}`;
};

export async function POST(request: NextRequest) {
  try {
    logDebug("Request received");
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    logDebug("Session authenticated", { userId: session.user.id });

    // Parse the form data
    const formData = await request.formData()
    const userId = formData.get("userId") as string
    const name = formData.get("name") as string
    const avatarFile = formData.get("avatar") as File | null
    
    logDebug("Form data parsed", { 
      userId,
      name,
      hasAvatar: !!avatarFile,
      avatarType: avatarFile?.type,
      avatarSize: avatarFile?.size
    });

    // Validate inputs
    if (!userId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if the user has permission to update this profile
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = { name }
    
    // Handle avatar upload if provided
    if (avatarFile) {
      logDebug("Processing avatar upload");
      
      // Validate the image file
      if (!isValidImage(avatarFile.type)) {
        return NextResponse.json(
          { error: "Invalid image format. Please upload JPEG, PNG, GIF or WebP." },
          { status: 400 }
        )
      }

      if (!isValidFileSize(avatarFile.size, 5)) { // 5MB max
        return NextResponse.json(
          { error: "Image file is too large. Maximum size is 5MB." },
          { status: 400 }
        )
      }

      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), "public", "uploads", "avatars")
        logDebug("Uploads directory", { uploadsDir });
        
        try {
          await mkdir(uploadsDir, { recursive: true })
          logDebug("Directory created or already exists");
        } catch (error) {
          console.error("Error creating directory:", error)
          logDebug("Error creating directory", { error });
        }

        // Generate a unique filename
        const filename = generateUniqueFilename(userId, avatarFile.name)
        const filePath = join(uploadsDir, filename)
        logDebug("File path prepared", { filename, filePath });

        // Save the file
        const arrayBuffer = await avatarFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await writeFile(filePath, buffer)
        logDebug("File written successfully");

        // Update the image URL
        const imageUrl = `/uploads/avatars/${filename}`
        updateData.image = imageUrl
        logDebug("Image URL added to update data", { imageUrl });
      } catch (fileError) {
        console.error("File handling error:", fileError);
        logDebug("File handling error", { error: fileError });
        return NextResponse.json(
          { error: fileError instanceof Error ? fileError.message : "Failed to process image upload" },
          { status: 500 }
        )
      }
    }

    logDebug("Updating user in database", { updateData });
    
    // Update the user record in the database
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });
      
      logDebug("User updated successfully", { updatedUser });
  
      // Return success response
      return NextResponse.json({
        message: "Profile updated successfully",
        ...updatedUser,
      });
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      logDebug("Database error", { 
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        code: dbError?.code
      });
      
      // Check for specific Prisma errors
      if (dbError.code === 'P2025') {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: dbError instanceof Error ? dbError.message : "Database update failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Profile update error:", error)
    logDebug("Profile update error", { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    )
  }
} 