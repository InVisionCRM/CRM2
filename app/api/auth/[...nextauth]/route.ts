import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth/options"

// Ensure Node runtime (cookies/session handling not guaranteed on edge for v4)
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
