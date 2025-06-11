import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { GoogleDriveService } from '@/lib/services/googleDrive'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get the lead to verify it exists and get the Google Drive folder ID
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { 
        id: true,
        googleDriveFolderId: true,
        firstName: true,
        lastName: true
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      contractType,
      signatures,
      dates,
      names,
      addresses,
      contactInfo,
      pdfBuffer, // Base64 encoded PDF
      fileName
    } = body

    // Initialize Google Drive service with default credentials
    const googleDrive = new GoogleDriveService({
      credentials: process.env.GOOGLE_DRIVE_CREDENTIALS
    })

    // If lead doesn't have a Google Drive folder, create one
    let folderId = lead.googleDriveFolderId
    if (!folderId) {
      const folder = await googleDrive.createFolder(`${lead.firstName} ${lead.lastName} - Documents`)
      folderId = folder.id
      await prisma.lead.update({
        where: { id },
        data: { googleDriveFolderId: folderId }
      })
    }

    // Upload PDF to Google Drive
    const file = await googleDrive.uploadFile({
      name: fileName,
      type: 'application/pdf',
      content: Buffer.from(pdfBuffer, 'base64'),
      parentFolderId: folderId
    })

    // Save contract to database
    const contract = await prisma.contract.create({
      data: {
        leadId: id,
        contractType,
        signatures,
        dates,
        names,
        addresses,
        contactInfo,
        pdfUrl: file.webViewLink || file.webContentLink
      }
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error saving contract:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get all contracts for a lead
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get contracts for this lead
    const contracts = await prisma.contract.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
} 