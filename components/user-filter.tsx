"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

export type UserOption = {
  id: string
  name: string
}

// Default mock users
const defaultUsers: UserOption[] = [
  { id: "user1", name: "Mike Johnson" },
  { id: "user2", name: "Lisa Brown" },
  { id: "user3", name: "David Smith" },
  { id: "user4", name: "Sarah Wilson" },
]

interface UserFilterProps {
  users: UserOption[]
  selectedUser: string | null
  onUserChange: (userId: string | null) => void
  isLoading?: boolean
}

export function UserFilter({ users, selectedUser, onUserChange, isLoading = false }: UserFilterProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(selectedUser)

  const handleUserChange = (userId: string | null) => {
    setSelected(userId)
    onUserChange(userId)
  }

  // Helper to get first name and last initial
  function formatShortName(name: string): string {
    const [first, ...rest] = name.split(" ");
    if (!first) return name;
    const last = rest.length > 0 ? rest[rest.length - 1] : "";
    return last ? `${first} ${last[0]}.` : first;
  }

  const selectedUserName = selected ? users.find((user) => user.id === selected)?.name || "Users" : "Users";
  const selectedUserShort = selected && users.find((user) => user.id === selected) ? formatShortName(users.find((user) => user.id === selected)!.name) : "Users";

  if (isLoading) {
    return <Skeleton className="h-10 w-14" />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          className="w-full sm:w-[120px] justify-between bg-black/20 backdrop-blur-sm border-white/20 hover:bg-black/30 text-lg px-2"
        >
          <User className="mr-2 h-5 w-5" />
          <span className="truncate">{selectedUserShort}</span>
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-[280px] p-0 bg-black/30 backdrop-blur-lg border-white/20">
        <Command>
          <CommandInput placeholder="Search users..." className="bg-transparent text-lg" />
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandEmpty className="text-white/70 text-lg">No user found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  handleUserChange(null)
                  setOpen(false)
                }}
                className="cursor-pointer hover:bg-white/10 text-lg py-3"
              >
                <Check className={cn("mr-2 h-5 w-5", !selected ? "opacity-100" : "opacity-0")} />
                Users
              </CommandItem>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    handleUserChange(user.id)
                    setOpen(false)
                  }}
                  className="cursor-pointer hover:bg-white/10 text-lg py-3"
                >
                  <Check className={cn("mr-2 h-5 w-5", selected === user.id ? "opacity-100" : "opacity-0")} />
                  {formatShortName(user.name)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
