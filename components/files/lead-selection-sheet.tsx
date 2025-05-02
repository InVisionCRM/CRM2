"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search, User } from "lucide-react"
import { useLeads } from "@/hooks/use-leads"
import type { LeadSummary } from "@/types/dashboard"

interface LeadSelectionSheetProps {
  isOpen: boolean
  onClose: () => void
  onLeadSelect: (lead: LeadSummary) => void
}

export function LeadSelectionSheet({ isOpen, onClose, onLeadSelect }: LeadSelectionSheetProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { leads, isLoading, error } = useLeads({})
  const [filteredLeads, setFilteredLeads] = useState<LeadSummary[]>([])

  // Filter leads based on search query
  useEffect(() => {
    if (!leads) return

    if (!searchQuery.trim()) {
      setFilteredLeads(leads)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.address.toLowerCase().includes(query) ||
        lead.phone?.includes(query),
    )
    setFilteredLeads(filtered)
  }, [searchQuery, leads])

  const handleLeadSelect = (lead: LeadSummary) => {
    onLeadSelect(lead)
    onClose()
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-gray-200 dark:border-gray-800 p-2 flex items-center justify-between">
          <DrawerTitle>Select a Lead</DrawerTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
            <span className="sr-only">Close</span>
          </Button>
        </DrawerHeader>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, email, or address..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-pulse">Loading leads...</div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">Error loading leads. Please try again.</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">No leads found matching your search.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredLeads.map((lead) => (
                <Button
                  key={lead.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleLeadSelect(lead)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.address}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
