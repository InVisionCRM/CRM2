import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "../[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    return NextResponse.json({
      authenticated: !!session,
      session,
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ error: "Failed to check authentication status" }, { status: 500 })
  }
}
