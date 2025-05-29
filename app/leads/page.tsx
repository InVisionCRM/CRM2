"use client"

import { useState, useCallback, useEffect } from "react"
import LeadsClient from "@/app/leads/LeadsClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, ArrowUpDown } from "lucide-react"
import { CreateLeadForm } from "@/components/forms/CreateLeadForm"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useDebouncedCallback } from "use-debounce"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { UserFilter, type UserOption } from "@/components/user-filter"
import { getAssignableUsersAction } from "@/app/actions/user-actions"
import { SearchBar } from "@/components/ui/search-bar"

export type SortField = "name" | "status" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export default function LeadsPage() {
  const [openCreateForm, setOpenCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOptions, setSortOptions] = useState<SortOptions>({ field: "createdAt", order: "desc" });
  const [users, setUsers] = useState<UserOption[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true)
      try {
        const result = await getAssignableUsersAction()
        if (result.success && result.users) {
          setUsers(result.users.map(u => ({ id: u.id, name: u.name || "Unnamed User", email: u.email || "" })));
        } else {
          console.error("Failed to fetch users:", result.message);
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        setUsers([]);
      } finally {
        setIsLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [])

  const handleLeadCreated = (leadId: string) => {
    toast({
      title: "Lead Created",
      description: "New lead has been successfully created.",
      variant: "default",
    })
    router.refresh() 
  }

  const debouncedSetSearchQuery = useDebouncedCallback((value: string) => setSearchQuery(value), 300)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => debouncedSetSearchQuery(e.target.value), [debouncedSetSearchQuery])
  const handleSortChange = (value: string) => {
    const [field, order] = value.split("_") as [SortField, SortOrder];
    setSortOptions({ field, order });
  };

  return (
    <div className="w-full pt-[100px] px-4">
      <div className="w-full flex justify-end items-center gap-4 mt-[80px] mb-10">
        <Button 
          size="default"
          className="text-black font-medium bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 shadow-lg whitespace-nowrap"
          onClick={() => setOpenCreateForm(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Create Lead
        </Button>
      </div>

      <CreateLeadForm
        open={openCreateForm}
        onOpenChange={setOpenCreateForm}
        onSuccess={handleLeadCreated}
      />

      <LeadsClient 
        searchQuery={searchQuery} 
        sortOptions={sortOptions} 
        selectedUser={selectedUser} 
        users={users} 
        isLoadingUsers={isLoadingUsers} 
        onUserChange={setSelectedUser} 
        onSortChange={setSortOptions} 
        onSearchChange={setSearchQuery} 
      />
    </div>
  )
}
