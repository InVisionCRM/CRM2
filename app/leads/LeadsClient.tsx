"use client"

import { useMemo, useState } from "react"
import { useLeads } from "@/hooks/use-leads"
import { LeadsList } from "@/components/leads-list"
import { Skeleton } from "@/components/ui/skeleton"
import type { StatusCount, LeadSummary } from "@/types/dashboard"
import { StatusDropdownMenu } from "@/components/leads/status-dropdown-menu"
import { LeadStatus } from "@prisma/client"
import type { SortOptions, SortField, SortOrder } from "@/app/leads/page"
import { UserFilter, type UserOption } from "@/components/user-filter"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateLeadForm } from "@/components/forms/CreateLeadForm"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { ActivityFeed } from "@/components/leads/ActivityFeed"
import { LeadFiles } from "@/components/leads/lead-files"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AddNote } from "@/components/leads/AddNote"

function LeadsLoading() {
  const skeletonBase = "bg-[rgba(236,234,224,0.06)]"
  const skeletonStrong = "bg-[rgba(236,234,224,0.08)]"
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="overflow-hidden border border-[rgba(236,234,224,0.08)] bg-[#161D18] rounded-xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)]">
          {/* Compact Row Skeleton */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <Skeleton className={`w-8 h-8 rounded-full ${skeletonStrong}`} />
              </div>

              <div className="flex-1 min-w-0">
                <Skeleton className={`h-5 w-32 sm:w-48 ${skeletonStrong}`} />
              </div>

              <div className="flex-shrink-0">
                <Skeleton className={`h-6 w-20 rounded-full ${skeletonStrong}`} />
              </div>
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
              <Skeleton className={`h-8 w-8 rounded ${skeletonStrong}`} />
            </div>
          </div>

          {/* Randomly show some expanded skeletons */}
          {i % 3 === 0 && (
            <div className="border-t border-[rgba(236,234,224,0.08)] bg-[#1B231D]/40 p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className={`h-48 w-full rounded-lg ${skeletonBase}`} />
                </div>

                <div className="space-y-2 justify-center flex flex-col w-full">
                  <Skeleton className={`h-20 w-full rounded ${skeletonBase}`} />
                  <Skeleton className={`h-8 w-24 rounded ${skeletonBase}`} />
                </div>
              </div>

              <div className="border-t border-[rgba(236,234,224,0.08)]"></div>

              <div className="space-y-1">
                <Skeleton className={`h-20 w-full rounded-lg ${skeletonBase}`} />
              </div>

              <div className="space-y-3">
                <Skeleton className={`h-20 w-full rounded-lg ${skeletonBase}`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[rgba(236,234,224,0.08)]">
                <div className="space-y-3">
                  <Skeleton className={`h-6 w-20 ${skeletonStrong}`} />
                  <div className="space-y-2">
                    <Skeleton className={`h-4 w-full ${skeletonBase}`} />
                    <Skeleton className={`h-4 w-3/4 ${skeletonBase}`} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Skeleton className={`h-6 w-24 ${skeletonStrong}`} />
                  <div className="space-y-2">
                    <Skeleton className={`h-4 w-full ${skeletonBase}`} />
                    <Skeleton className={`h-4 w-2/3 ${skeletonBase}`} />
                  </div>
                </div>
              </div>

              <div className="border-t border-[rgba(236,234,224,0.08)] pt-4">
                <Skeleton className={`h-6 w-24 mx-auto mb-3 ${skeletonStrong}`} />
                <div className="flex w-full rounded-lg overflow-hidden gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className={`h-16 flex-1 ${skeletonBase}`} />
                  ))}
                </div>
              </div>

              <div className="border-t border-[rgba(236,234,224,0.08)] pt-4">
                <Skeleton className={`h-6 w-28 mx-auto mb-3 ${skeletonStrong}`} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className={`h-16 rounded ${skeletonBase}`} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161D18] border border-[rgba(236,234,224,0.08)] rounded-xl mt-4">
        <div className="flex items-center space-x-2">
          <Skeleton className={`h-4 w-8 ${skeletonBase}`} />
          <Skeleton className={`h-8 w-16 ${skeletonBase}`} />
          <Skeleton className={`h-4 w-16 ${skeletonBase}`} />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className={`h-4 w-20 ${skeletonBase}`} />
          <div className="flex items-center space-x-1">
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className={`h-8 w-8 ${skeletonBase}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface LeadsClientProps {
  searchQuery?: string;
  sortOptions: SortOptions;
  selectedUser: string | null;
  users: UserOption[];
  isLoadingUsers: boolean;
  onUserChange: (user: string | null) => void;
  onSortChange: (sortOptions: SortOptions) => void;
  onSearchChange: (query: string) => void;
  openCreateForm?: boolean;
  setOpenCreateForm?: (open: boolean) => void;
}

export default function LeadsClient({ 
  searchQuery = "", 
  sortOptions, 
  selectedUser,
  users,
  isLoadingUsers,
  onUserChange,
  onSortChange,
  onSearchChange,
  openCreateForm,
  setOpenCreateForm
}: LeadsClientProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null)
  const { leads, isLoading, error } = useLeads({ status: selectedStatus, assignedTo: selectedUser, search: searchQuery, sort: sortOptions.field, order: sortOptions.order })
  const router = useRouter()

  // State for dialogs
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [isFilesViewOpen, setIsFilesViewOpen] = useState(false);
  const [selectedLeadForDialog, setSelectedLeadForDialog] = useState<LeadSummary | null>(null);
  const [refreshActivityKey, setRefreshActivityKey] = useState(0)

  const statusCounts: StatusCount[] = useMemo(() => [
    {
      status: LeadStatus.signed_contract,
      count: leads.filter((lead) => lead.status === LeadStatus.signed_contract).length,
      color: "border-blue-500",
      borderColor: "border-blue-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/Signed-Contract-YymWy953WCStBonHJV4Ags1GZZnRgZ.png",
    },
    {
      status: LeadStatus.scheduled,
      count: leads.filter((lead) => lead.status === LeadStatus.scheduled).length,
      color: "border-blue-500",
      borderColor: "border-blue-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/Scheduled-0wiyJ7ynJ81HasqBzYPklcXByysAUP.png",
    },
    {
      status: LeadStatus.colors,
      count: leads.filter((lead) => lead.status === LeadStatus.colors).length,
      color: "border-indigo-500",
      borderColor: "border-indigo-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/colors-DBitQFEELepnwDxeeDBoCqKoXcRwNO.png",
    },
    {
      status: LeadStatus.acv,
      count: leads.filter((lead) => lead.status === LeadStatus.acv).length,
      color: "border-purple-500",
      borderColor: "border-purple-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/acv-xBRM3B9fD3tTeWwu2qqC2IBR7mLA98.png",
    },
    {
      status: LeadStatus.job,
      count: leads.filter((lead) => lead.status === LeadStatus.job).length,
      color: "border-orange-500",
      borderColor: "border-orange-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/job-YcMjwzDLpiItcohAiG7ilRQzXocUOh.png",
    },
    {
      status: LeadStatus.completed_jobs,
      count: leads.filter((lead) => lead.status === LeadStatus.completed_jobs).length,
      color: "border-green-500",
      borderColor: "border-green-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/job-completed-M3sT1rLN0jZa8z386aqPK8NNjlguPh.png",
    },
    {
      status: LeadStatus.zero_balance,
      count: leads.filter((lead) => lead.status === LeadStatus.zero_balance).length,
      color: "border-green-500",
      borderColor: "border-green-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/zero-balance-0c8qigPnLMX1ls6nfyoOXQuzxSq3eG.png",
    },
    {
      status: LeadStatus.denied,
      count: leads.filter((lead) => lead.status === LeadStatus.denied).length,
      color: "border-red-500",
      borderColor: "border-red-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/denied-sozqLkPt6Pe2MnEQWyhJIMmFg0InCb.png",
    },
    {
      status: LeadStatus.follow_ups,
      count: leads.filter((lead) => lead.status === LeadStatus.follow_ups).length,
      color: "border-yellow-500",
      borderColor: "border-yellow-500",
      imageUrl:
        "https://ehjgnin9yr7pmzsk.public.blob.vercel-storage.com/Statuses/follow-up-vgb8yPL09PsiEjOWRGOXb1ZcOerKdP.png",
    },
  ], [leads])

  if (error) return <p className="text-red-600">Error: {error.message}</p>

  const handleStatusSelect = (status: LeadStatus | null) => {
    setSelectedStatus(status)
  }

  const handleViewActivity = (lead: LeadSummary) => {
    setSelectedLeadForDialog(lead);
    setIsActivityLogOpen(true);
  };

  const handleViewFiles = (lead: LeadSummary) => {
    setSelectedLeadForDialog(lead);
    setIsFilesViewOpen(true);
  };

  const handleLeadCreated = (leadId: string) => {
    toast({
      title: "Lead Created",
      description: "New lead has been successfully created.",
      variant: "default",
    })
    router.refresh()
    setOpenCreateForm?.(false)
  }

  const handleNoteAddedSuccessfully = () => {
    setRefreshActivityKey(prev => prev + 1);
    toast({ title: "Note Added", description: "The new note has been successfully added." });
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("_") as [SortField, SortOrder];
    onSortChange({ field, order });
  };

  const userFilterTriggerText = selectedUser ? users.find(u => u.id === selectedUser)?.name || "Unknown User" : "All";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 sm:gap-3">
        <UserFilter 
          users={users} 
          selectedUser={selectedUser} 
          onUserChange={onUserChange} 
          isLoading={isLoadingUsers || isLoading}
        />
        <StatusDropdownMenu 
          statusCounts={statusCounts} 
          activeStatus={selectedStatus} 
          onStatusSelect={handleStatusSelect} 
          disabled={isLoading}
        />
        <Select onValueChange={handleSortChange} defaultValue={`${sortOptions.field}_${sortOptions.order}`} disabled={isLoading}>
          <SelectTrigger className="flex items-center gap-1.5 text-lg h-10 px-3 w-full sm:w-[140px]">
            <span></span>
            <span className="font-medium"><SelectValue placeholder="Sort by" /></span>
          </SelectTrigger>
          <SelectContent className="w-80 text-lg">
            <SelectItem value="createdAt_desc" className="text-lg py-4">Newest First</SelectItem>
            <SelectItem value="createdAt_asc" className="text-lg py-4">Oldest First</SelectItem>
            <SelectItem value="name_asc" className="text-lg py-4">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc" className="text-lg py-4">Name (Z-A)</SelectItem>
            <SelectItem value="status_asc" className="text-lg py-4">Status (A-Z)</SelectItem>
            <SelectItem value="status_desc" className="text-lg py-4">Status (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CreateLeadForm 
        open={openCreateForm || false}
        onOpenChange={setOpenCreateForm || (() => {})}
        onSuccess={handleLeadCreated}
      />

      <div className="mt-6">
        {isLoading ? (
          <LeadsLoading />
        ) : leads.length === 0 ? (
          <div className="text-center py-12 border border-[rgba(236,234,224,0.08)] rounded-2xl bg-[#161D18] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)]">
            <p className="text-[#A7B0A6]">No leads found matching your criteria.</p>
            {(searchQuery || selectedStatus || selectedUser) && (
              <p className="text-sm text-[#6E776E] mt-1">
                Try adjusting your search terms or filters.
              </p>
            )}
          </div>
        ) : (
          <LeadsList 
            leads={leads} 
            isLoading={isLoading} 
            assignedTo={selectedUser} 
            onViewActivity={handleViewActivity}
            onViewFiles={handleViewFiles}
            onUserFilter={onUserChange}
          />
        )}
      </div>

      {/* Activity Log Dialog */}
      {selectedLeadForDialog && (
        <Dialog open={isActivityLogOpen} onOpenChange={setIsActivityLogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Activity Log: {selectedLeadForDialog.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 p-1 pr-2 -mr-2">
              <ActivityFeed leadId={selectedLeadForDialog.id} key={refreshActivityKey} />
            </ScrollArea>
            <DialogFooter className="mt-auto pt-4 flex items-center justify-between">
              <AddNote leadId={selectedLeadForDialog.id} onSuccess={handleNoteAddedSuccessfully} />
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Files Dialog */}
      {selectedLeadForDialog && (
        <Dialog open={isFilesViewOpen} onOpenChange={setIsFilesViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Files: {selectedLeadForDialog.name}</DialogTitle>
            </DialogHeader>
            <LeadFiles leadId={selectedLeadForDialog.id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
