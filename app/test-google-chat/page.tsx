"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function TestGoogleChatPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testGoogleChat = async () => {
    if (!session?.accessToken) {
      toast.error("You need to be logged in with Google")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/test/google-chat-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)

      if (response.ok) {
        toast.success("Google Chat test successful!")
      } else {
        toast.error(data.error || "Test failed")
      }
    } catch (error) {
      console.error('Error testing Google Chat:', error)
      toast.error("Failed to test Google Chat")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test Google Chat API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will test if Google Chat API works without requiring a Chat app.
            </p>
            
            <div className="text-sm">
              <strong>Session Status:</strong> {session ? "Logged in" : "Not logged in"}
            </div>
            
            <div className="text-sm">
              <strong>Access Token:</strong> {session?.accessToken ? "Present" : "Missing"}
            </div>
          </div>

          <Button 
            onClick={testGoogleChat}
            disabled={isLoading || !session?.accessToken}
            className="w-full"
          >
            {isLoading ? "Testing..." : "Test Google Chat API"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 