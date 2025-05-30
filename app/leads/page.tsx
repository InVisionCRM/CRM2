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
    <div className="w-full pt-[20px] px-4">
      <div className="w-full flex justify-center items-center gap-1 mt-[10px] mb-10">
        <SearchBar
          containerClassName="!relative !transform-none !left-auto !top-auto !z-auto !w-60"
          topOffset="0px"
          placeholder=""
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

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
