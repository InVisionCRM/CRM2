'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function TestPWAInputsPage() {
  const [textInput, setTextInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [textareaValue, setTextareaValue] = useState('')
  const [isPWA, setIsPWA] = useState(false)
  const [userAgent, setUserAgent] = useState('')

  // Check if running in PWA mode
  if (typeof window !== 'undefined') {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInApp = window.navigator.standalone === true
    setIsPWA(isStandalone || isInApp)
    setUserAgent(navigator.userAgent)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Purlin PWA Input Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>PWA Mode</Label>
              <div className="text-sm text-muted-foreground">
                {isPWA ? 'Running in PWA mode' : 'Running in browser mode'}
              </div>
            </div>
            <div>
              <Label>User Agent</Label>
              <div className="text-xs text-muted-foreground break-all">
                {userAgent}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-input">Text Input</Label>
            <Input
              id="text-input"
              type="text"
              placeholder="Type here to test text input..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
            <div className="text-sm text-muted-foreground">
              Value: {textInput || '(empty)'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-input">Email Input</Label>
            <Input
              id="email-input"
              type="email"
              placeholder="test@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <div className="text-sm text-muted-foreground">
              Value: {emailInput || '(empty)'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="textarea">Textarea</Label>
            <Textarea
              id="textarea"
              placeholder="Type here to test textarea..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              rows={4}
            />
            <div className="text-sm text-muted-foreground">
              Value: {textareaValue || '(empty)'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Native HTML Input (for comparison)</Label>
            <input
              type="text"
              placeholder="Native input test..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="space-y-2">
            <Label>Native HTML Textarea (for comparison)</Label>
            <textarea
              placeholder="Native textarea test..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              rows={4}
              style={{ fontSize: '16px' }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <strong>Display Mode:</strong> {typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser' : 'unknown'}
          </div>
          <div className="text-sm">
            <strong>Standalone:</strong> {typeof window !== 'undefined' ? window.navigator.standalone ? 'true' : 'false' : 'unknown'}
          </div>
          <div className="text-sm">
            <strong>Touch Support:</strong> {typeof window !== 'undefined' ? 'ontouchstart' in window ? 'yes' : 'no' : 'unknown'}
          </div>
          <div className="text-sm">
            <strong>Viewport Width:</strong> {typeof window !== 'undefined' ? window.innerWidth : 'unknown'}
          </div>
          <div className="text-sm">
            <strong>Viewport Height:</strong> {typeof window !== 'undefined' ? window.innerHeight : 'unknown'}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            setTextInput('')
            setEmailInput('')
            setTextareaValue('')
          }}
          variant="outline"
        >
          Clear All
        </Button>
        <Button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.reload()
            }
          }}
          variant="outline"
        >
          Reload Page
        </Button>
      </div>
    </div>
  )
} 