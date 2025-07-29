"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function DebugSessionPage() {
  const { data: session } = useSession()
  const [showTokens, setShowTokens] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  if (!session) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Session</CardTitle>
            <CardDescription>No session found. Please log in first.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debug Session</h1>
        <p className="text-muted-foreground">
          This page helps you find your Google access token for the migration script
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>
            Your current session data. Look for the accessToken below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">User:</span>
            <span>{session.user?.name} ({session.user?.email})</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Role:</span>
            <Badge variant={session.user?.role === 'ADMIN' ? 'default' : 'secondary'}>
              {session.user?.role}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Has Access Token:</span>
            <Badge variant={session.accessToken ? 'default' : 'destructive'}>
              {session.accessToken ? 'Yes' : 'No'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Has Refresh Token:</span>
            <Badge variant={session.refreshToken ? 'default' : 'destructive'}>
              {session.refreshToken ? 'Yes' : 'No'}
            </Badge>
          </div>

          {session.accessToken && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Access Token:</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTokens(!showTokens)}
                  >
                    {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(session.accessToken!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {showTokens && (
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-mono break-all">
                      {session.accessToken}
                    </p>
                  </div>
                  
                  {session.refreshToken && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-mono break-all">
                        Refresh: {session.refreshToken}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">If you see an access token above:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click the copy button to copy the access token</li>
              <li>Add it to your <code>.env.local</code> file:</li>
              <li><code>GOOGLE_ACCESS_TOKEN=your_token_here</code></li>
              <li>Run the migration script: <code>npm run create-chat-spaces</code></li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">If you don't see an access token:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Make sure you're logged in with Google</li>
              <li>Check if your Google account has Chat API access</li>
              <li>Try logging out and back in</li>
              <li>Check the browser console for any errors</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Session Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
} 