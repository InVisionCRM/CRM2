import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createLeadChatSpace } from "@/lib/services/leadChatIntegration"
import { prisma } from "@/lib/db/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leadId = params.id

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        address: true,
        status: true,
        assignedToId: true,
        googleChatSpaceId: true
      }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Check if chat space already exists
    if (lead.googleChatSpaceId) {
      return NextResponse.json({ 
        error: "Chat space already exists for this lead",
        spaceId: lead.googleChatSpaceId
      }, { status: 400 })
    }

    // Get assigned user details if assigned
    let assignedTo = undefined
    if (lead.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: lead.assignedToId },
        select: { id: true, name: true, email: true }
      })
      if (assignedUser) {
        assignedTo = {
          id: assignedUser.id,
          name: assignedUser.name || 'Unknown User',
          email: assignedUser.email || ''
        }
      }
    }

    // Create the chat space
    const chatResult = await createLeadChatSpace({
      leadId: lead.id,
      leadName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead',
      leadEmail: lead.email || undefined,
      leadAddress: lead.address || undefined,
      leadStatus: lead.status,
      createdBy: {
        id: session.user.id,
        name: session.user.name || 'Unknown User',
        email: session.user.email || ''
      },
      assignedTo
    }, session)

    if (!chatResult.success) {
      return NextResponse.json(
        { error: chatResult.error || "Failed to create chat space" },
        { status: 500 }
      )
    }

    // Update the lead with the chat space ID
    await prisma.lead.update({
      where: { id: leadId },
      data: { googleChatSpaceId: chatResult.spaceId }
    })

    return NextResponse.json({ 
      success: true, 
      spaceId: chatResult.spaceId,
      message: "Chat space created successfully"
    })
  } catch (error) {
    console.error("Error creating chat space:", error)
    return NextResponse.json(
      { error: "Failed to create chat space" },
      { status: 500 }
    )
  }
} 