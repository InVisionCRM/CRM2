import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { updateContractPdfUrl } from "@/lib/db/contracts"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { pdf_url } = body

    if (!pdf_url) {
      return NextResponse.json(
        { success: false, message: "Missing required field: pdf_url" },
        { status: 400 },
      )
    }

    // Update the contract's PDF URL
    const contract = await updateContractPdfUrl(id, pdf_url)

    return NextResponse.json({
      success: true,
      message: "Contract PDF URL updated successfully",
      contract,
    })
  } catch (error) {
    console.error("Error updating contract PDF URL:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to update contract PDF URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
} 