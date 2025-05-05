import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from '@vercel/blob';

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
const isValidFileSize = (size: number, maxSizeMB: number = 2): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
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

      if (!isValidFileSize(avatarFile.size, 2)) {
        return NextResponse.json(
          { error: "Image file is too large. Maximum size is 2MB." },
          { status: 400 }
        )
      }

      try {
        // Generate a unique path for the blob
        const filename = `${userId}-${Date.now()}.${avatarFile.type.split('/')[1]}`;
        const pathname = `avatars/${filename}`;
        
        logDebug("Uploading file to Vercel Blob", { pathname });

        // Upload to Vercel Blob storage
        const blob = await put(pathname, avatarFile, {
          access: 'public',
          contentType: avatarFile.type,
        });
        
        logDebug("File uploaded to Vercel Blob", { 
          url: blob.url,
          pathname: blob.pathname
        });

        // Update the image URL to use the Blob URL
        updateData.image = blob.url;
      } catch (fileError) {
        console.error("File handling error:", fileError);
        logDebug("File handling error", { error: fileError });
        return NextResponse.json(
          { error: fileError instanceof Error ? fileError.message : "Failed to process image upload" },
          { status: 500 }
        )
      }
    }

    logDebug("Updating user in database", { 
      updateData: { 
        ...updateData, 
        image: updateData.image ? updateData.image : undefined 
      } 
    });
    
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
      
      logDebug("User updated successfully", { 
        ...updatedUser,
        image: updatedUser.image || null
      });
  
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