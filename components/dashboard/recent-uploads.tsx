"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Download, User2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Array of Tailwind border colors
const borderColors = [
  "border-blue-200",
  "border-green-200",
  "border-purple-200",
  "border-orange-200",
  "border-pink-200",
  "border-teal-200",
  "border-indigo-200",
  "border-rose-200"
]

// Function to get a random border color
function getRandomColor(): string {
  return borderColors[Math.floor(Math.random() * borderColors.length)]
}

interface UploadItem {
  id: string
  name: string
  url: string
  size: number
  type: string
  createdAt: string | Date
  leadId: string
  leadName: string
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit'
  }) + ' ' + date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

function formatFileName(name: string): { docType: string; displayName: string } {
  if (name.includes("/")) {
    const [docType, leadName] = name.split("/")
    return {
      docType: docType.charAt(0).toUpperCase() + docType.slice(1),
      displayName: leadName || name
    }
  }
  return {
    docType: "File",
    displayName: name
  }
}

export function RecentUploads() {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const limit = 25 // Show up to 25 uploads in the scrollable container

  const fetchUploads = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/files/recent?limit=${limit}`)
      if (!res.ok) throw new Error(`Failed to load uploads: ${res.status}`)
      const data = await res.json()
      setUploads(data.items.slice(0, limit))
    } catch (err) {
      console.error("Error fetching uploads:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUploads()
  }, [])

  if (isLoading) {
    return <UploadsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-lg">Recent Uploads</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUploads}
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
          Recent Uploads
          {uploads.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({uploads.length} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {uploads.length === 0 ? (
          <p className="text-muted-foreground text-center py-2">No uploads yet.</p>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto pb-4 -mx-6">
              <div className="flex gap-4 px-6 min-w-full w-max">
                {uploads.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      "w-[300px] shrink-0 border border-border/40 rounded-lg p-4 overflow-hidden",
                      getRandomColor()
                    )}
                  >
                    <div className="space-y-3">
                      <div>
                        <span className={cn(
                          "font-medium text-sm px-2 py-0.5 rounded mb-2 inline-block truncate max-w-full",
                          getRandomColor().replace('border-', 'text-').replace('-200', '-600')
                        )}>
                          {formatFileName(file.name).docType}
                        </span>
                        <Link
                          href={file.url}
                          target="_blank"
                          className="block hover:underline text-foreground font-medium break-words overflow-hidden"
                          style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {formatFileName(file.name).displayName}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(new Date(file.createdAt))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <Link href={file.url} target="_blank">
                            <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">Open in Google Drive</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <a href={`${file.url}&export=download`} download>
                            <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">Download file</span>
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <Link href={`/leads/${file.leadId}`}>
                            <User2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            <span className="sr-only">View lead</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
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

function UploadsSkeleton() {
  return (
    <Card className="shadow-sm w-full">
      <CardHeader className="pb-3 border-b">
        <Skeleton className="h-6 w-36" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex gap-4 overflow-x-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[300px] shrink-0 border border-border/40 rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 