"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  users?: UserOption[]
  selectedUser?: string | null
  onUserChange?: (userId: string | null) => void
}

export function UserFilter({ users = defaultUsers, selectedUser = null, onUserChange = () => {} }: UserFilterProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(selectedUser)

  const handleUserChange = (userId: string | null) => {
    setSelected(userId)
    onUserChange(userId)
  }

  const selectedUserName = selected ? users.find((user) => user.id === selected)?.name || "All Users" : "All Users"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox" 
          aria-expanded={open} 
          className="w-full sm:w-[200px] justify-between bg-black/20 backdrop-blur-sm border-white/20 hover:bg-black/30"
        >
          <User className="mr-2 h-4 w-4" />
          <span className="truncate">{selectedUserName}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-[200px] p-0 bg-black/30 backdrop-blur-lg border-white/20">
        <Command>
          <CommandInput placeholder="Search users..." className="bg-transparent" />
          <CommandList>
            <CommandEmpty className="text-white/70">No user found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  handleUserChange(null)
                  setOpen(false)
                }}
                className="cursor-pointer hover:bg-white/10"
              >
                <Check className={cn("mr-2 h-4 w-4", !selected ? "opacity-100" : "opacity-0")} />
                All Users
              </CommandItem>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    handleUserChange(user.id)
                    setOpen(false)
                  }}
                  className="cursor-pointer hover:bg-white/10"
                >
                  <Check className={cn("mr-2 h-4 w-4", selected === user.id ? "opacity-100" : "opacity-0")} />
                  {user.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
