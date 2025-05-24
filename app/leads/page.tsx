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
      <SearchBar 
        placeholder="Search by name"
        onChange={handleSearchChange} 
        value={searchQuery}
        topOffset="20px"
        containerClassName="pt-[50px] px-4"
      />

      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mt-[80px] mb-10">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <UserFilter 
            users={users} 
            selectedUser={selectedUser} 
            onUserChange={setSelectedUser} 
            isLoading={isLoadingUsers}
          />
          <Select onValueChange={handleSortChange} defaultValue={`${sortOptions.field}_${sortOptions.order}`}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt_desc">Newest First</SelectItem>
              <SelectItem value="createdAt_asc">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="status_asc">Status (A-Z)</SelectItem>
              <SelectItem value="status_desc">Status (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          size="default"
          className="text-black font-medium bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 shadow-lg whitespace-nowrap mt-4 md:mt-0"
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

      <LeadsClient searchQuery={searchQuery} sortOptions={sortOptions} selectedUser={selectedUser} />
    </div>
  )
}
