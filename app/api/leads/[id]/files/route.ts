import { NextResponse } from "next/server"
import { getFilesByLeadId } from "@/lib/db/files"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id
    console.log("Fetching files for lead:", leadId)

    const files = await getFilesByLeadId(leadId)

    // Transform to match the LeadFile interface
    const result = files.map(file => ({
      id: file.id,
      name: file.name,
      url: file.url,
      type: file.type,
      size: file.size,
      category: file.category,
      uploadedAt: file.createdAt
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch files" },
      { status: 500 }
    )
  }
} 