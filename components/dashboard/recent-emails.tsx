"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, Paperclip, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useSession } from "next-auth/react"

interface EmailMessage {
  id: string
  threadId: string
  snippet: string
  internalDate: string
  payloadHeaders: {
    Subject: string
    From: string
    Date: string
  }
  body?: string
  attachments?: Array<{
    id: string
    name: string
    url: string
  }>
}

// Helper function to safely format the date
function formatEmailDate(internalDate: string): string {
  try {
    // Gmail's internalDate is in Unix timestamp milliseconds format
    const date = new Date(parseInt(internalDate, 10))
    // Check if the date is valid before formatting
    if (isNaN(date.getTime())) {
      return 'Unknown date'
    }
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Unknown date'
  }
}

export function RecentEmails() {
  const { data: session } = useSession()
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const limit = 25 // Show up to 25 emails in the scrollable container

  const fetchEmails = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/gmail/messages?limit=${limit}`)
      if (!res.ok) throw new Error(`Failed to load emails: ${res.status}`)
      const data = await res.json()
      setEmails(data.messages.slice(0, limit))
    } catch (err) {
      console.error("Error fetching emails:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading) {
    return <EmailsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-lg">Recent Emails</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmails}
            className="h-8 px-2 text-xs"
          >
            Retry
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-xs text-center py-4">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Recent Emails
          {emails.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({emails.length} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {emails.length === 0 ? (
          <p className="text-muted-foreground text-center py-2">No emails yet.</p>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto pb-4 -mx-6">
              <div className="flex gap-4 px-6 min-w-full w-max">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="w-[350px] shrink-0 border border-border/40 rounded-lg p-4 cursor-pointer"
                    onClick={() => toggleExpand(email.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {email.payloadHeaders.From.split('<')[0].trim()}
                        </span>
                      </div>
                      {expanded.has(email.id) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="text-sm font-medium truncate">
                        {email.payloadHeaders.Subject}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatEmailDate(email.internalDate)}
                      </div>
                    </div>

                    {expanded.has(email.id) && (
                      <div className="mt-4 space-y-3">
                        <div className="max-h-[100px] overflow-y-auto text-sm text-muted-foreground">
                          {email.snippet}
                        </div>
                        
                        {email.attachments && email.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {email.attachments.map(attachment => (
                              <Link
                                key={attachment.id}
                                href={attachment.url}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{attachment.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <a
                            href={`https://mail.google.com/mail/u/${session?.user?.email}/#inbox/${email.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>View in Gmail</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmailsSkeleton() {
  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3 border-b">
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex gap-4 overflow-x-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[350px] shrink-0 border border-border/40 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 