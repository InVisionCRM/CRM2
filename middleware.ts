import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    console.log("Middleware token:", token ? "exists" : "null")

    // Get the pathname from the URL
    const { pathname } = req.nextUrl

    // The matcher in `config` should ideally handle these exclusions.
    // This check is an additional safeguard.
    if (pathname.startsWith("/auth/signin") || 
        pathname.startsWith("/api/auth") || 
        pathname.startsWith("/_next/") ||
        pathname.includes(".") // Generally ignore paths with extensions (assets)
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
      const signInUrl = new URL("/auth/signin", req.url) 
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
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
  ],
}
