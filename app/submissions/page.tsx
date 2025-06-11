"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Download, Eye, RefreshCw, FileText, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface Submitter {
  id: number
  submission_id: number
  uuid: string
  email: string
  slug: string
  sent_at: string | null
  opened_at: string | null
  completed_at: string | null
  declined_at: string | null
  created_at: string
  updated_at: string
  name: string
  phone: string | null
  status: string
  role: string
  metadata: Record<string, any>
  preferences: Record<string, any>
}

interface Template {
  id: number
  name: string
  external_id: string | null
  folder_name: string
  created_at: string
  updated_at: string
}

interface CreatedByUser {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface Submission {
  id: number
  name: string | null
  source: string
  submitters_order: string
  slug: string
  status: string
  audit_log_url: string | null
  combined_document_url: string | null
  expire_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
  submitters: Submitter[]
  template: Template
  created_by_user: CreatedByUser
}

interface SubmissionsResponse {
  data: Submission[]
  pagination: {
    count: number
    next: number | null
    prev: number | null
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'pending':
    case 'sent':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'declined':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'expired':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />
    case 'opened':
      return <ExternalLink className="h-4 w-4 text-blue-500" />
    default:
      return <FileText className="h-4 w-4 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    case 'pending':
    case 'sent':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
    case 'declined':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    case 'expired':
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
    case 'opened':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
  }
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pagination, setPagination] = useState<SubmissionsResponse['pagination'] | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const fetchSubmissions = async (params: Record<string, string> = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchParams = new URLSearchParams()
      
      if (searchQuery) searchParams.append('q', searchQuery)
      if (statusFilter !== 'all') searchParams.append('status', statusFilter)
      
      // Add any additional params
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value)
      })

      const response = await fetch(`/api/docuseal/submissions?${searchParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch submissions')
      }

      const data: SubmissionsResponse = await response.json()
      setSubmissions(data.data || [])
      setPagination(data.pagination || null)
      
    } catch (err) {
      console.error('Error fetching submissions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions')
      toast({
        title: "Error",
        description: "Failed to fetch submissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleSearch = () => {
    fetchSubmissions()
  }

  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
    // Auto-search when filter changes
    setTimeout(() => fetchSubmissions(), 100)
  }

  const handleRefresh = () => {
    fetchSubmissions()
    toast({
      title: "Refreshed",
      description: "Submissions list has been refreshed.",
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openSubmissionDetails = (submission: Submission) => {
    // You can implement a detailed view modal or navigate to a details page
    if (submission.audit_log_url) {
      window.open(submission.audit_log_url, '_blank')
    } else {
      toast({
        title: "No audit log available",
        description: "This submission doesn't have an audit log URL.",
        variant: "destructive",
      })
    }
  }

  if (error && !loading) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-lg mx-auto border-destructive/50">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" /> Error Loading Submissions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchSubmissions()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">DocuSeal Submissions</h1>
          <p className="text-muted-foreground">
            Manage and track all contract submissions
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending/Sent</SelectItem>
                  <SelectItem value="opened">Opened</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {['completed', 'pending', 'opened', 'declined', 'expired'].map((status) => {
          // Count all submissions with this status, including 'sent' for pending
          let count = 0
          if (status === 'pending') {
            count = submissions.filter(s => s.status === 'pending' || s.status === 'sent').length
          } else {
            count = submissions.filter(s => s.status === status).length
          }
          
          return (
            <Card key={status} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              setStatusFilter(status === 'pending' ? 'pending' : status)
              setTimeout(() => fetchSubmissions(), 100)
            }}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria.' 
                : 'No submissions have been created yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        {submission.template.name}
                      </h3>
                      <Badge className={cn("border", getStatusColor(submission.status))}>
                        {getStatusIcon(submission.status)}
                        <span className="ml-1 capitalize">
                          {submission.status === 'sent' ? 'pending' : submission.status}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Submitters:</span>{' '}
                        {submission.submitters.map(s => s.name || s.email).join(', ')}
                      </p>
                      <p>
                        <span className="font-medium">Created:</span>{' '}
                        {formatDate(submission.created_at)}
                      </p>
                      {submission.completed_at && (
                        <p>
                          <span className="font-medium">Completed:</span>{' '}
                          {formatDate(submission.completed_at)}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Template:</span>{' '}
                        {submission.template.folder_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSubmissionDetails(submission)}
                      disabled={!submission.audit_log_url}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {submission.combined_document_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(submission.combined_document_url!, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {pagination && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Showing {submissions.length} of {pagination.count} submissions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 