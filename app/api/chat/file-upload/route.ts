import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { spaceId, fileName, fileUrl, fileType, uploadedBy } = body

    // Extract lead ID from space name
    const spaceName = spaceId.split('/').pop() || ''
    const match = spaceName.match(/Lead: .* - Claim#([A-Z0-9]+) - ([a-f0-9-]+)/)
    
    if (!match) {
      // Fallback to old format
      const oldMatch = spaceName.match(/Lead: .* - ([a-f0-9-]+)/)
      if (!oldMatch) {
        return NextResponse.json({ error: "Could not identify lead from chat space" }, { status: 400 })
      }
      const leadId = oldMatch[1]
      await processFileUpload(leadId, fileName, fileUrl, fileType, uploadedBy)
    } else {
      const claimNumber = match[1]
      const leadId = match[2]
      
      // Find lead by claim number or ID
      let lead = await prisma.lead.findFirst({
        where: { claimNumber: claimNumber }
      })
      
      if (!lead) {
        lead = await prisma.lead.findUnique({
          where: { id: leadId }
        })
      }
      
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 })
      }
      
      await processFileUpload(lead.id, fileName, fileUrl, fileType, uploadedBy)
    }

    return NextResponse.json({ 
      success: true, 
      message: "File uploaded and synced to CRM" 
    })
  } catch (error) {
    console.error('Error processing file upload:', error)
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    )
  }
}

async function processFileUpload(leadId: string, fileName: string, fileUrl: string, fileType: string, uploadedBy: string) {
  try {
    // Get lead details for better logging
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        firstName: true,
        lastName: true,
        claimNumber: true
      }
    })

    // Create file record in CRM
    const fileRecord = await prisma.file.create({
      data: {
        leadId: leadId,
        name: fileName,
        url: fileUrl,
        type: fileType,
        uploadedBy: uploadedBy,
        source: 'google_chat',
        uploadedAt: new Date()
      }
    })

    // Add activity record
    await prisma.activity.create({
      data: {
        leadId: leadId,
        content: `File "${fileName}" uploaded via Google Chat by ${uploadedBy}`,
        type: 'FILE_UPLOAD',
        metadata: {
          fileId: fileRecord.id,
          fileType: fileType,
          source: 'google_chat'
        }
      }
    })

    const leadName = lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : 'Unknown Lead'
    const claimInfo = lead?.claimNumber ? ` (Claim #${lead.claimNumber})` : ''
    
    console.log(`✅ File "${fileName}" synced to CRM for lead ${leadName}${claimInfo}`)
    
    return {
      success: true,
      fileId: fileRecord.id,
      message: `File "${fileName}" successfully synced to CRM`
    }
  } catch (error) {
    console.error('Error processing file upload:', error)
    throw error
  }
} 