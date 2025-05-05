import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"
import { isValidImage, isValidFileSize, generateUniqueFilename } from "@/lib/file-utils"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()
    const userId = formData.get("userId") as string
    const name = formData.get("name") as string
    const avatarFile = formData.get("avatar") as File | null

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
      // Validate the image file
      if (!isValidImage(avatarFile)) {
        return NextResponse.json(
          { error: "Invalid image format. Please upload JPEG, PNG, GIF or WebP." },
          { status: 400 }
        )
      }

      if (!isValidFileSize(avatarFile, 5)) { // 5MB max
        return NextResponse.json(
          { error: "Image file is too large. Maximum size is 5MB." },
          { status: 400 }
        )
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "public", "uploads", "avatars")
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        console.error("Error creating directory:", error)
      }

      // Generate a unique filename
      const filename = generateUniqueFilename(userId, avatarFile.name)
      const filePath = join(uploadsDir, filename)

      // Save the file
      const arrayBuffer = await avatarFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await writeFile(filePath, buffer)

      // Update the image URL
      const imageUrl = `/uploads/avatars/${filename}`
      updateData.image = imageUrl
    }

    // Update the user record in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    // Return success response
    return NextResponse.json({
      message: "Profile updated successfully",
      ...updatedUser,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    
    // Check for specific Prisma errors
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
} 