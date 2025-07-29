"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { MessageSquare, Send, ExternalLink, Users, Calendar } from "lucide-react"

interface LeadChatWidgetProps {
  leadId: string
  leadName: string
  leadStatus: string
}

interface ChatSpace {
  name: string
  displayName: string
  description?: string
}

export function LeadChatWidget({ leadId, leadName, leadStatus }: LeadChatWidgetProps) {
  const { data: session } = useSession()
  const [chatSpace, setChatSpace] = useState<ChatSpace | null>(null)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [hasChatSpace, setHasChatSpace] = useState(false)

  useEffect(() => {
    fetchChatSpace()
  }, [leadId])

  const fetchChatSpace = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/chat`)
      if (response.ok) {
        const data = await response.json()
        setChatSpace(data.space)
        setHasChatSpace(true)
      } else {
        setHasChatSpace(false)
      }
    } catch (error) {
      console.error('Error fetching chat space:', error)
      setHasChatSpace(false)
    } finally {
      setIsLoading(false)
    }
  }

  const createChatSpace = async () => {
    if (!session?.accessToken) {
      toast.error("You need to be logged in with Google to create chat spaces")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/chat/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success("Chat space created successfully!")
        // Refresh the chat space data
        await fetchChatSpace()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create chat space")
      }
    } catch (error) {
      console.error('Error creating chat space:', error)
      toast.error("Failed to create chat space")
    } finally {
      setIsSending(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (response.ok) {
        toast.success("Message sent successfully")
        setMessage("")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send message")
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const openChatInNewTab = () => {
    if (chatSpace?.name) {
      // Google Chat space URL format
      const chatUrl = `https://chat.google.com/room/${chatSpace.name}`
      window.open(chatUrl, '_blank')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Chat
          </CardTitle>
          <CardDescription>Loading chat information...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!hasChatSpace) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Chat
          </CardTitle>
          <CardDescription>
            No chat space found for this lead. Create one to enable team collaboration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
            <p className="text-muted-foreground">No chat space available for this lead</p>
            <Button 
              onClick={createChatSpace}
              disabled={isSending}
              className="mx-auto"
            >
              {isSending ? (
                "Creating..."
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Chat Space
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will create a Google Chat space and add all admins and team members
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Team Chat
            </CardTitle>
            <CardDescription>
              Chat room for {leadName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{leadStatus}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={openChatInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open Chat
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chatSpace && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Chat Space: {chatSpace.displayName}</span>
            </div>
            
            {chatSpace.description && (
              <div className="text-sm text-muted-foreground">
                <p className="whitespace-pre-line">{chatSpace.description}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Messages are sent to all team members in the chat space
            </div>
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || isSending}
              size="sm"
            >
              {isSending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Team Chat Features:</p>
              <ul className="mt-1 space-y-1">
                <li>• All admins and team members are automatically added</li>
                <li>• Status changes are automatically posted to chat</li>
                <li>• Direct link to this lead in the CRM</li>
                <li>• Real-time collaboration on lead management</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 