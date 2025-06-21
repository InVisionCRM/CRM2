import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise
    const id = params.id
    const body = await request.json()
    
    // Validate the request body
    const { dateType, date } = body
    
    if (!dateType || !date) {
      return NextResponse.json(
        { error: "dateType and date are required" },
        { status: 400 }
      )
    }

    // Validate date type
    const validDateTypes = ['jobCompletionDate']
    if (!validDateTypes.includes(dateType)) {
      return NextResponse.json(
        { error: "Invalid date type" },
        { status: 400 }
      )
    }

    // First get the current lead to preserve existing metadata
    const currentLead = await prisma.lead.findUnique({
      where: { id },
      select: { metadata: true }
    })

    if (!currentLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Parse existing metadata or create new object
    const existingMetadata = currentLead.metadata as Record<string, any> || {}
    
    // Ensure importantDates object exists
    if (!existingMetadata.importantDates) {
      existingMetadata.importantDates = {}
    }

    // Store the date as a text string
    existingMetadata.importantDates[dateType] = date

    // Update the lead with the new metadata
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        metadata: existingMetadata,
        updatedAt: new Date()
      },
      select: {
        id: true,
        metadata: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('Error updating important date:', error)
    return NextResponse.json(
      { error: "Failed to update important date" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const params = await paramsPromise
    const id = params.id
    const body = await request.json()
    
    // Validate the request body
    const { dateType } = body
    
    if (!dateType) {
      return NextResponse.json(
        { error: "dateType is required" },
        { status: 400 }
      )
    }

    // Validate date type
    const validDateTypes = ['jobCompletionDate']
    if (!validDateTypes.includes(dateType)) {
      return NextResponse.json(
        { error: "Invalid date type" },
        { status: 400 }
      )
    }

    // First get the current lead to preserve existing metadata
    const currentLead = await prisma.lead.findUnique({
      where: { id },
      select: { metadata: true }
    })

    if (!currentLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Parse existing metadata or create new object
    const existingMetadata = currentLead.metadata as Record<string, any> || {}
    
    // Remove the date from importantDates if it exists
    if (existingMetadata.importantDates && existingMetadata.importantDates[dateType]) {
      delete existingMetadata.importantDates[dateType]
    }

    // Update the lead with the new metadata
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        metadata: existingMetadata,
        updatedAt: new Date()
      },
      select: {
        id: true,
        metadata: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('Error deleting important date:', error)
    return NextResponse.json(
      { error: "Failed to delete important date" },
      { status: 500 }
    )
  }
} 