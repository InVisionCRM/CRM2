import { NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const { GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY, SHARED_DRIVE_ID } = process.env

    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY || !SHARED_DRIVE_ID) {
      return NextResponse.json(
        { error: "Google Drive credentials not configured" },
        { status: 500 }
      )
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        client_email: GOOGLE_SA_EMAIL,
        private_key: GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    const drive = google.drive({ version: "v3", auth })

    // Google Drive pagination relies on pageToken rather than offset. For a simple UI with small page sizes we
    // can retrieve the first (page * limit) results and slice out the requested page window.
    const requestPageSize = Math.min(page * limit, 1000)

    const res = await drive.files.list({
      driveId: SHARED_DRIVE_ID,
      corpora: "drive",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      fields: "files(id,name,size,mimeType,createdTime,webViewLink,parents)",
      orderBy: "createdTime desc",
      pageSize: requestPageSize,
      q: "trashed=false",
    })

    const allFiles = res.data.files ?? []

    // Slice to only the items belonging to this page
    const pageItems = allFiles.slice((page - 1) * limit, page * limit)

    const transformed = pageItems.map((file) => ({
      id: file.id!,
      name: file.name!,
      url: file.webViewLink!,
      size: file.size ? parseInt(file.size) : 0,
      type: file.mimeType || "file",
      createdAt: file.createdTime!,
      leadId: extractLeadId(file.name || ""),
      leadName: extractLeadName(file.name || ""),
    }))

    return NextResponse.json({
      items: transformed,
      total: allFiles.length, // approximate within first requestPageSize
      page,
      limit,
      totalPages: Math.ceil(allFiles.length / limit),
    })
  } catch (error) {
    console.error("Error fetching recent uploads from Drive:", error)
    return NextResponse.json(
      { error: "Failed to fetch recent uploads" },
      { status: 500 }
    )
  }
}

// Attempts to pull leadId out of filename patterns `ID <id>` or `/<id>.` etc.
function extractLeadId(name: string): string {
  const idMatch = name.match(/ID (\w+)/) || name.match(/(?:\/|\\)([\w-]{6,})(?:\.|$)/)
  return idMatch ? idMatch[1] : ""
}

function extractLeadName(name: string): string {
  // For new naming convention: fileType/LeadName/leadId.ext
  if (name.includes("/")) {
    const parts = name.split("/")
    return parts.length >= 2 ? parts[1] : "Lead"
  }
  return "Lead"
} 