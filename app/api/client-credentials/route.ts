import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"

// Generate secure random string
function generateSecureString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.role === 'ADMIN') {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      )
    }

    // Generate client credentials
    const clientId = generateSecureString(16)     // 32 character string
    const clientSecret = generateSecureString(32) // 64 character string

    // Create API client
    const apiClient = await prisma.apiClient.create({
      data: {
        name,
        clientId,
        clientSecret,
      }
    })

    return NextResponse.json({
      success: true,
      client: {
        name: apiClient.name,
        clientId: apiClient.clientId,
        clientSecret: apiClient.clientSecret,
      }
    })
  } catch (error) {
    console.error("Error creating API client:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create API client" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.role === 'ADMIN') {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get all active API clients
    const clients = await prisma.apiClient.findMany({
      where: { active: true },
      select: {
        name: true,
        clientId: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      clients
    })
  } catch (error) {
    console.error("Error fetching API clients:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch API clients" },
      { status: 500 }
    )
  }
} 