"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function TestLogoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const handleLogout = async () => {
    console.log("Starting logout process...")
    try {
      await signOut({ 
        callbackUrl: "/auth/signin",
        redirect: true 
      })
      console.log("Logout successful")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Checking authentication status...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You are not logged in. Redirecting to sign in...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Logout Test Page</h1>
          <p className="text-muted-foreground mt-2">
            Test the logout functionality
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>
              Information about your current authentication session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Status:</strong> {status}
            </div>
            {session?.user && (
              <>
                <div>
                  <strong>User ID:</strong> {session.user.id}
                </div>
                <div>
                  <strong>Name:</strong> {session.user.name}
                </div>
                <div>
                  <strong>Email:</strong> {session.user.email}
                </div>
                <div>
                  <strong>Role:</strong> {session.user.role}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logout Options</CardTitle>
            <CardDescription>
              Test different logout methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleLogout}
              className="w-full"
              variant="destructive"
            >
              Test Logout (NextAuth.js)
            </Button>
            
            <Button 
              onClick={() => signOut({ callbackUrl: "/signed-out" })}
              className="w-full"
              variant="outline"
            >
              Logout to Signed Out Page
            </Button>

            <Button 
              onClick={() => signOut({ redirect: false })}
              className="w-full"
              variant="outline"
            >
              Logout Without Redirect
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>NEXTAUTH_URL:</strong> {process.env.NEXT_PUBLIC_NEXTAUTH_URL || "Not set"}</div>
              <div><strong>NEXTAUTH_SECRET:</strong> {process.env.NEXTAUTH_SECRET ? "Set" : "Not set"}</div>
              <div><strong>Session Token:</strong> {session ? "Present" : "None"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 