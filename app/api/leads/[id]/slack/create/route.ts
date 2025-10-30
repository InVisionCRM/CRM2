import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createLeadSlackChannel } from "@/lib/services/leadSlackIntegration"
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
        phone: true,
        address: true,
        status: true,
        claimNumber: true,
        insuranceCompany: true,
        dateOfLoss: true,
        damageType: true,
        assignedToId: true,
        googleDriveFolderId: true,
        googleDriveUrl: true,
        slackChannelId: true
      }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Check if Slack channel already exists
    if (lead.slackChannelId) {
      return NextResponse.json({
        error: "Slack channel already exists for this lead",
        channelId: lead.slackChannelId
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

    // Create the Slack channel
    const slackResult = await createLeadSlackChannel({
      leadId: lead.id,
      leadName: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Lead',
      leadEmail: lead.email || undefined,
      leadPhone: lead.phone || undefined,
      leadAddress: lead.address || undefined,
      leadStatus: lead.status,
      leadClaimNumber: lead.claimNumber || undefined,
      leadInsuranceCompany: lead.insuranceCompany || undefined,
      leadDateOfLoss: lead.dateOfLoss || undefined,
      leadDamageType: lead.damageType || undefined,
      googleDriveFolderId: lead.googleDriveFolderId || undefined,
      googleDriveUrl: lead.googleDriveUrl || undefined,
      createdBy: {
        id: session.user.id,
        name: session.user.name || 'Unknown User',
        email: session.user.email || ''
      },
      assignedTo
    })

    if (!slackResult.success) {
      return NextResponse.json(
        { error: slackResult.error || "Failed to create Slack channel" },
        { status: 500 }
      )
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: "LEAD_UPDATED",
        title: "Slack Channel Created",
        description: `Slack channel #${slackResult.channelName} created for this lead`,
        userId: session.user.id,
        leadId: leadId
      }
    })

    return NextResponse.json({
      success: true,
      channelId: slackResult.channelId,
      channelName: slackResult.channelName,
      message: "Slack channel created successfully"
    })
  } catch (error) {
    console.error("Error creating Slack channel:", error)
    return NextResponse.json(
      { error: "Failed to create Slack channel" },
      { status: 500 }
    )
  }
}
