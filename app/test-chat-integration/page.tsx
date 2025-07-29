'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TestChatIntegration() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testCommandsEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chat/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: '/help',
          spaceId: 'spaces/test-space-id',
          userEmail: 'test@example.com'
        })
      })

      const result = await response.json()
      addResult(`Commands endpoint: ${response.ok ? '✅ Success' : '❌ Failed'} - ${JSON.stringify(result)}`)
    } catch (error) {
      addResult(`❌ Commands endpoint error: ${error}`)
    }
    setLoading(false)
  }

  const testFileUploadEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chat/file-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: 'spaces/test-space-id',
          fileName: 'test-file.pdf',
          fileUrl: 'https://example.com/test-file.pdf',
          fileType: 'document',
          uploadedBy: 'test@example.com'
        })
      })

      const result = await response.json()
      addResult(`File upload endpoint: ${response.ok ? '✅ Success' : '❌ Failed'} - ${JSON.stringify(result)}`)
    } catch (error) {
      addResult(`❌ File upload endpoint error: ${error}`)
    }
    setLoading(false)
  }

  const testTestEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test/chat-commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: '/test',
          spaceId: 'spaces/test-space-id',
          userEmail: 'test@example.com'
        })
      })

      const result = await response.json()
      addResult(`Test endpoint: ${response.ok ? '✅ Success' : '❌ Failed'} - ${JSON.stringify(result)}`)
    } catch (error) {
      addResult(`❌ Test endpoint error: ${error}`)
    }
    setLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Chat Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={testCommandsEndpoint} 
              disabled={loading}
              variant="outline"
            >
              Test Commands API
            </Button>
            <Button 
              onClick={testFileUploadEndpoint} 
              disabled={loading}
              variant="outline"
            >
              Test File Upload API
            </Button>
            <Button 
              onClick={testTestEndpoint} 
              disabled={loading}
              variant="outline"
            >
              Test Test API
            </Button>
            <Button 
              onClick={clearResults} 
              variant="destructive"
            >
              Clear Results
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Test Results:</Label>
            <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Click a test button above.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-semibold mb-2">🔧 Troubleshooting Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Run the test endpoints above to check if APIs are working</li>
              <li>Update your Google Apps Script with the fixed code from <code>GOOGLE_CHAT_APPS_SCRIPT_FIXED.md</code></li>
              <li>Make sure your Apps Script is deployed and the webhook URL is correct</li>
              <li>Test commands in Google Chat: <code>/help</code>, <code>/status</code></li>
              <li>Try uploading a file to a lead's chat space</li>
              <li>Change a lead's status in the CRM and check if notification appears in chat</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 