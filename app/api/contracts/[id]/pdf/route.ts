import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { updateContractPdfUrl } from "@/lib/db/contracts"
import { prisma } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { pdfUrl } = body

    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 })
    }

    // Update the contract with the PDF URL
    const contract = await prisma.contract.update({
      where: { id },
      data: { pdfUrl }
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error updating contract PDF:', error)
    return NextResponse.json({ error: 'Failed to update contract PDF' }, { status: 500 })
  }
} 