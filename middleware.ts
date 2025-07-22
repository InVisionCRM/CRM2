import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest as NextRequestType } from 'next/server'
import { withAuth } from "next-auth/middleware"

// Verify API key for contract system requests
async function validateApiCredentials(request: NextRequestType) {
  // Skip validation for normal web requests
  if (request.headers.get('sec-fetch-dest') === 'document') {
    return true
  }

  const clientId = request.headers.get('x-client-id')
  const clientSecret = request.headers.get('x-client-secret')

  // For now, allow requests without credentials to prevent middleware failures
  // TODO: Implement proper API key validation when database is available
  if (!clientId || !clientSecret) {
    return true // Allow requests without credentials for now
  }

  // Basic validation - you can enhance this later
  return clientId.length > 0 && clientSecret.length > 0
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
      pathname.startsWith("/signed-out") ||
      pathname.startsWith("/manifest.json") ||
      pathname.startsWith("/sw.js") ||
      pathname.startsWith("/offline.html")
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
      // For now, allow admin routes to pass through to the page level
      // The page will handle role checking and redirect if needed
      // This prevents middleware database connection issues
      return NextResponse.next()
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
    // - PWA files (manifest.json, sw.js, offline.html)
    "/((?!api/auth|auth/signin|_next/static|_next/image|manifest.json|sw.js|offline.html|.*\..*).*)",
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
