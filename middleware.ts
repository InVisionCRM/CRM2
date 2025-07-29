import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"

// Verify API key for contract system requests
async function validateApiCredentials(request: NextRequest) {
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
  },
  pages: {
    signIn: '/auth/signin',
  }
})

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
