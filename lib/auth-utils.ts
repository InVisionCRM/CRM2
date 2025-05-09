// Simple authentication utility functions
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

export type Session = {
  user: SessionUser
}

/**
 * Get the current user session from the request
 */
export async function getSession(): Promise<Session | null> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return null
    }
    return session as Session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

/**
 * Check if the current request is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  return {
    ...session.user,
    id: session.user.id || session.user.email // Fallback to email if id not available
  }
}
