import { NextResponse } from "next/server"
import { getMarkersByAddress } from "@/lib/db/vision-markers"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const address = url.searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
    }

    const markers = await getMarkersByAddress(address)
    return NextResponse.json(markers)
  } catch (error) {
    console.error("Error searching vision markers:", error)
    return NextResponse.json({ error: "Failed to search vision markers" }, { status: 500 })
  }
}
