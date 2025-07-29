"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function GetAccessTokenSimplePage() {
  const [showToken, setShowToken] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const getSessionData = () => {
    try {
      // Try multiple ways to get session data
      const sessionToken = localStorage.getItem('next-auth.session-token')
      const sessionTokenProd = localStorage.getItem('__Secure-next-auth.session-token')
      
      let session = null
      
      if (sessionToken) {
        session = JSON.parse(sessionToken)
      } else if (sessionTokenProd) {
        session = JSON.parse(sessionTokenProd)
      }

      // Also try to get from cookies
      if (!session) {
        const cookies = document.cookie.split(';')
        const sessionCookie = cookies.find(cookie => 
          cookie.trim().startsWith('next-auth.session-token=') ||
          cookie.trim().startsWith('__Secure-next-auth.session-token=')
        )
        
        if (sessionCookie) {
          const token = sessionCookie.split('=')[1]
          try {
            session = JSON.parse(decodeURIComponent(token))
          } catch (e) {
            console.log('Could not parse session cookie')
          }
        }
      }

      setSessionData(session)
    } catch (error) {
      console.error('Error getting session data:', error)
      setSessionData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getSessionData()
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Access token copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy token")
    }
  }

  const accessToken = sessionData?.accessToken

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading session data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Google Access Token (Simple)</h1>
        <p className="text-muted-foreground mt-2">
          Direct access to your session data
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
            <Button
              variant="outline"
              size="sm"
              onClick={getSessionData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
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
                This could mean:
              </p>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
                <li>• You're not signed in</li>
                <li>• The session doesn't have an access token</li>
                <li>• You need to re-authenticate with Google</li>
                <li>• The token is stored differently</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Data</CardTitle>
          <CardDescription>
            Raw session information from localStorage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Session Found:</strong> {sessionData ? "Yes" : "No"}
            </div>
            {sessionData && (
              <>
                <div>
                  <strong>Session Keys:</strong> {Object.keys(sessionData).join(', ')}
                </div>
                <div>
                  <strong>Access Token:</strong> {accessToken ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Token Length:</strong> {accessToken ? accessToken.length : 0} characters
                </div>
                <div>
                  <strong>User:</strong> {sessionData.user?.name || 'Unknown'} ({sessionData.user?.email || 'Unknown'})
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>
            Additional debugging information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>LocalStorage Keys:</strong> {Object.keys(localStorage).filter(key => key.includes('next-auth')).join(', ')}
            </div>
            <div>
              <strong>Session Token in LocalStorage:</strong> {localStorage.getItem('next-auth.session-token') ? "Yes" : "No"}
            </div>
            <div>
              <strong>Secure Session Token:</strong> {localStorage.getItem('__Secure-next-auth.session-token') ? "Yes" : "No"}
            </div>
            <div>
              <strong>Raw Session Data:</strong>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 