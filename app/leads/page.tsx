"use client"

import { useState, useCallback, useEffect } from "react"
import LeadsClient from "@/app/leads/LeadsClient"
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
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export type SortField = "name" | "status" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOptions, setSortOptions] = useState<SortOptions>({ field: "createdAt", order: "desc" });
  const [users, setUsers] = useState<UserOption[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [openCreateForm, setOpenCreateForm] = useState(false)

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

  const debouncedSetSearchQuery = useDebouncedCallback((value: string) => setSearchQuery(value), 300)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchQuery(e.target.value);
  }, [debouncedSetSearchQuery]);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("_") as [SortField, SortOrder];
    setSortOptions({ field, order });
  };

  return (
    <div className="w-full px-4">
      <div className="relative flex items-center gap-1 mt-2 mb-8">
        <SearchBar
          containerClassName="!relative !transform-none !left-auto !top-auto !z-auto !w-60 !max-w-none !p-0"
          topOffset="0px"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={handleSearchChange}
          startOpen={true}
        />
      </div>

      <Button
        onClick={() => setOpenCreateForm(true)}
        className="fixed top-4 right-10 bg-[#59ff00] text-black hover:bg-[#59ff00]/90 whitespace-nowrap z-50 
          text-sm sm:text-base 
          px-2 sm:px-3 
          py-1 sm:py-2
          h-8 sm:h-9
          flex items-center"
      >
        <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Create Lead</span>
        <span className="sm:hidden">New Lead</span>
      </Button>

      <LeadsClient 
        searchQuery={searchQuery} 
        sortOptions={sortOptions} 
        selectedUser={selectedUser} 
        users={users} 
        isLoadingUsers={isLoadingUsers} 
        onUserChange={setSelectedUser} 
        onSortChange={setSortOptions} 
        onSearchChange={setSearchQuery}
        openCreateForm={openCreateForm}
        setOpenCreateForm={setOpenCreateForm}
      />
    </div>
  )
}
