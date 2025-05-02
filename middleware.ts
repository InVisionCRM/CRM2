import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req) {
  try {
    // Get the token from the request
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    console.log("Middleware token:", token ? "exists" : "null")

    // Get the pathname from the URL
    const { pathname } = req.nextUrl

    // Allow public routes
    const publicRoutes = ["/login", "/register", "/forgot-password"]
    if (publicRoutes.some((route) => pathname.startsWith(route)) || pathname.startsWith("/api/auth")) {
      return NextResponse.next()
    }

    // If the user is not authenticated and trying to access protected routes
    if (!token) {
      console.log("No token, redirecting to login")

      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ message: "Authentication required" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        })
      }

      // For page routes, redirect to login
      const url = new URL("/login", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

// Specify which routes should be protected
export const config = {
  matcher: [
    "/api/:path*",
    "/leads/:path*",
    "/map/:path*",
    "/financial-health/:path*",
    "/team-performance/:path*",
    "/contracts/:path*",
    "/weather/:path*",
    "/quick-links/:path*",
  ],
}
