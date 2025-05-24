"use client"

import { useState, useCallback } from "react"
import LeadsClient from "@/app/leads/LeadsClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { CreateLeadForm } from "@/components/forms/CreateLeadForm"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useDebouncedCallback } from "use-debounce"

export default function LeadsPage() {
  const [openCreateForm, setOpenCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleLeadCreated = (leadId: string) => {
    toast({
      title: "Lead Created",
      description: "New lead has been successfully created.",
      variant: "default",
    })
    router.refresh() // Refresh the page to show the new lead
  }

  // Debounce the search query update to avoid excessive re-renders
  const debouncedSetSearchQuery = useDebouncedCallback(
    (value: string) => {
      setSearchQuery(value)
    },
    300 // 300ms delay
  )

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    debouncedSetSearchQuery(value)
  }, [debouncedSetSearchQuery])

  return (
    <div className="w-full">
      {/* Header section with search and Create Lead button */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-10 pt-6 px-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or claim ID..."
            className="pl-9 w-full"
            onChange={handleSearch}
          />
        </div>
        <Button 
          size="default"
          className="text-black font-medium bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 shadow-lg whitespace-nowrap"
          onClick={() => setOpenCreateForm(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Create Lead
        </Button>
      </div>

      {/* Create Lead Form Dialog */}
      <CreateLeadForm
        open={openCreateForm}
        onOpenChange={setOpenCreateForm}
        onSuccess={handleLeadCreated}
      />

      <LeadsClient searchQuery={searchQuery} />
    </div>
  )
}
