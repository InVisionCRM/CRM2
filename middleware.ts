import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest as NextRequestType } from 'next/server'
import { withAuth } from "next-auth/middleware"
import { prisma } from "@/lib/db/prisma"

// Verify API key for contract system requests
async function validateApiCredentials(request: NextRequestType) {
  // Skip validation for normal web requests
  if (request.headers.get('sec-fetch-dest') === 'document') {
    return true
  }

  const clientId = request.headers.get('x-client-id')
  const clientSecret = request.headers.get('x-client-secret')

  if (!clientId || !clientSecret) {
    return false
  }

  // Check credentials against database
  const apiClient = await prisma.apiClient.findFirst({
    where: {
      clientId,
      clientSecret,
      active: true
    }
  })

  return !!apiClient
}

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // For API routes that need both session and API key
      if (req.url.includes('/api/')) {
        return !!token && validateApiCredentials(req)
      }
      // For normal web routes, just check session
      return !!token
    }
  }
})

export async function middleware(request: NextRequestType) {
  try {
    // Get the pathname from the URL
    const { pathname } = request.nextUrl

    // For API routes that require client credentials
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      const isValidClient = await validateApiCredentials(request)
      if (!isValidClient) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Invalid client credentials' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      }
    }

    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    console.log("Middleware token:", token ? "exists" : "null")

    // The matcher in `config` should ideally handle these exclusions.
    // This check is an additional safeguard.
    if (
      pathname.startsWith("/auth/signin") || 
      pathname.startsWith("/api/auth") || 
      pathname.startsWith("/_next/") ||
      pathname.includes(".") ||
      pathname.startsWith("/signed-out") // ✅ add this
    ) {
      return NextResponse.next()
    }
    

    // If the user is not authenticated and trying to access protected routes
    if (!token) {
      console.log("No token, redirecting to sign-in page")

      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ message: "Authentication required" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        })
      }

      // For page routes, redirect to the custom sign-in page defined in authOptions
      // Ensure this path matches what's in your NextAuth config (pages.signIn)
      const signInUrl = new URL("/auth/signin", request.url) 
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Handle admin routes
    if (pathname.startsWith('/admin')) {
      try {
        // Fetch user role from database
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/user/role?userId=${token.id}`, {
          headers: {
            'Cookie': request.headers.get('cookie') || '',
          },
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch user role')
        }
        
        const data = await response.json()
        
        if (data.role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // For routes that only need API key verification (if any)
    if (pathname.includes('/api/public/')) {
      if (!validateApiCredentials(request)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Invalid API key' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    // Avoid redirect loops on error, consider an error page or just pass through
    return NextResponse.next()
  }
}

// Specify which routes should be protected
export const config = {
  matcher: [
    // Match all paths except for:
    // - /api/auth routes (NextAuth specific)
    // - /auth/signin (our sign-in page)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - files with extensions (e.g., .ico, .png, .svg)
    "/((?!api/auth|auth/signin|_next/static|_next/image|.*\..*).*)",
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
