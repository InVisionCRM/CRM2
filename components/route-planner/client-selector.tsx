"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { MapPin, Search, User, Phone, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface Client {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  type: 'client' | 'lead'
}

interface ClientSelectorProps {
  label: string
  value: string
  onChange: (value: string) => void
  onClientSelect?: (client: Client | null, address: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ClientSelector({ 
  label, 
  value, 
  onChange, 
  onClientSelect,
  placeholder = "Search for client...",
  disabled = false,
  className = ""
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [hoveredClient, setHoveredClient] = useState<Client | null>(null)
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch clients from API
  const fetchClients = async (query: string = "") => {
    if (disabled) {
      setClients([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/route-planner/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      } else {
        console.error('Failed to fetch clients')
        setClients([])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load initial clients when component mounts
  useEffect(() => {
    if (!disabled) {
      fetchClients() // Load all clients initially
    }
  }, [disabled])

  // Debounced client search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchQuery.length === 0) {
      return // Don't search if query is empty, use initial load
    }

    debounceRef.current = setTimeout(() => {
      fetchClients(searchQuery)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue)
    setShowSuggestions(true) // Always show suggestions when typing
    
    // If user is typing and it doesn't match selected client, clear selection
    if (selectedClient && newValue !== selectedClient.name) {
      setSelectedClient(null)
      onChange("")
      if (onClientSelect) {
        onClientSelect(null, "")
      }
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setSearchQuery(client.name)
    onChange(client.address)
    setShowSuggestions(false)
    if (onClientSelect) {
      onClientSelect(client, client.address)
    }
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
    // Load clients if not already loaded
    if (clients.length === 0 && !isLoading) {
      fetchClients()
    }
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicks on suggestions
    setTimeout(() => {
      if (!e.relatedTarget?.closest('[data-suggestions-container]')) {
        setShowSuggestions(false)
      }
    }, 150)
  }

  const handleViewLead = (client: Client) => {
    // Navigate to client/lead details page
    const path = client.type === 'lead' ? `/leads/${client.id}` : `/clients/${client.id}`
    window.open(path, '_blank')
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={label} className="text-white flex items-center gap-2">
        <User className="h-4 w-4" />
        {label}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="bg-black/30 border-white/20 text-white placeholder:text-gray-400 pl-10"
            disabled={disabled}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
            </div>
          )}
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && (clients.length > 0 || isLoading) && (
          <div 
            data-suggestions-container
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            {/* View Lead Button */}
            {hoveredClient && (
              <div className="absolute -top-1 right-0 z-10">
                <Button
                  onClick={() => handleViewLead(hoveredClient)}
                  size="sm"
                  className="bg-blue-500/50 hover:bg-blue-500/70 text-white border-blue-500/50 text-xs px-2 py-1 h-6"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View {hoveredClient.type === 'lead' ? 'Lead' : 'Client'}
                </Button>
              </div>
            )}
            
            <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-md shadow-lg max-h-80 overflow-auto">
              <Command>
                <CommandList>
                  {clients.length > 0 && (
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          onSelect={() => handleClientSelect(client)}
                          onMouseEnter={() => setHoveredClient(client)}
                          onMouseLeave={() => setHoveredClient(null)}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/10 text-white group"
                        >
                          <User className="h-4 w-4 shrink-0 text-blue-400" />
                          <div className="flex-1 min-w-0">
                            {/* Always show name */}
                            <div className="font-medium truncate text-white">
                              {client.name}
                            </div>
                            
                            {/* Show details on hover */}
                            {hoveredClient?.id === client.id && (
                              <div className="mt-2 space-y-1 text-xs text-gray-300">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="truncate">{client.address}</span>
                                </div>
                                {client.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span>{client.phone}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Client type badge */}
                          <div className={cn(
                            "shrink-0 text-xs px-2 py-1 rounded",
                            client.type === 'lead' 
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" 
                              : "bg-green-500/20 text-green-400 border border-green-500/50"
                          )}>
                            {client.type === 'lead' ? 'Lead' : 'Client'}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* Loading State */}
                  {isLoading && (
                    <CommandEmpty>
                      <div className="text-center py-4 text-gray-400">
                        <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full mx-auto mb-2" />
                        Searching clients...
                      </div>
                    </CommandEmpty>
                  )}

                  {/* No Results */}
                  {!isLoading && searchQuery.length > 2 && clients.length === 0 && (
                    <CommandEmpty>
                      <div className="text-center py-4 text-gray-400">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div>No clients found</div>
                        <div className="text-xs mt-1">Try a different search term</div>
                      </div>
                    </CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 