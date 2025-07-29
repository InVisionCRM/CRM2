"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function GetAccessTokenPage() {
  const { data: session, status } = useSession()
  const [showToken, setShowToken] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Access token copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy token")
    }
  }

  // Handle loading state
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading session...</span>
        </div>
      </div>
    )
  }

  // Handle unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to view your access token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please sign in to your CRM account first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle error state
  if (status === "error") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Session Error</CardTitle>
            <CardDescription>
              There was an error loading your session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please try refreshing the page or signing in again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safely access session data
  const accessToken = session?.accessToken
  const user = session?.user

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Google Access Token</h1>
        <p className="text-muted-foreground mt-2">
          Copy this token to use with the chat space migration script
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Access Token</Badge>
            {accessToken ? (
              <Badge variant="outline" className="text-green-600">
                Available
              </Badge>
            ) : (
              <Badge variant="destructive">Not Available</Badge>
            )}
          </CardTitle>
          <CardDescription>
            This token is required to create Google Chat spaces for your leads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accessToken ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showToken ? "Hide" : "Show"} Token
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(accessToken)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Token
                </Button>
              </div>

              {showToken && (
                <div className="p-4 bg-muted rounded-lg">
                  <code className="text-sm break-all">{accessToken}</code>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Next Steps:
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Copy the access token above</li>
                  <li>2. Add it to your <code>.env.local</code> file:</li>
                  <li className="ml-4">
                    <code>GOOGLE_ACCESS_TOKEN=your_token_here</code>
                  </li>
                  <li>3. Run the migration script:</li>
                  <li className="ml-4">
                    <code>npm run create-chat-spaces</code>
                  </li>
                </ol>
              </div>
            </>
          ) : (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                No Access Token Found
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This usually means you need to re-authenticate with Google. Try:
              </p>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
                <li>• Sign out and sign back in</li>
                <li>• Check if you granted Google Calendar/Drive permissions</li>
                <li>• Verify your Google account has the required scopes</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>
            Current user and session details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>User:</strong> {user?.name || 'Unknown'} ({user?.email || 'Unknown'})
            </div>
            <div>
              <strong>Role:</strong> {user?.role || 'Unknown'}
            </div>
            <div>
              <strong>Session Status:</strong> {status}
            </div>
            <div>
              <strong>Has Access Token:</strong> {accessToken ? "Yes" : "No"}
            </div>
            <div>
              <strong>Token Length:</strong> {accessToken ? accessToken.length : 0} characters
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>
            Additional session data for troubleshooting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Session Keys:</strong> {session ? Object.keys(session).join(', ') : 'No session'}
            </div>
            <div>
              <strong>User Keys:</strong> {user ? Object.keys(user).join(', ') : 'No user'}
            </div>
            <div>
              <strong>Access Token Type:</strong> {typeof accessToken}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 