import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { deleteContract } from "@/lib/db/contracts"
import { prisma } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Delete the contract from database
    await prisma.contract.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Contract deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting contract:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to delete contract: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
} 