"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MapPin, Clock, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"

interface AddressSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

interface AddressAutocompleteProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
}

export function AddressAutocomplete({ 
  label, 
  value, 
  onChange, 
  placeholder = "Enter address...",
  disabled = false,
  className = "",
  icon = <MapPin className="h-4 w-4" />
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentAddresses, setRecentAddresses] = useState<string[]>([])
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent addresses from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('route-planner-recent-addresses')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setRecentAddresses(parsed.slice(0, 5)) // Keep only last 5
      } catch (error) {
        console.error('Error loading recent addresses:', error)
      }
    }
  }, [])

  // Save address to recent addresses
  const saveToRecent = (address: string) => {
    if (!address.trim()) return
    
    const updated = [address, ...recentAddresses.filter(a => a !== address)].slice(0, 5)
    setRecentAddresses(updated)
    localStorage.setItem('route-planner-recent-addresses', JSON.stringify(updated))
  }

  // Fetch address suggestions from Google Places API
  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 2 || disabled) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.predictions || [])
      } else {
        console.error('Failed to fetch address suggestions')
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced address search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value])

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setShowSuggestions(newValue.length > 0)
  }

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    const address = suggestion.description
    onChange(address)
    saveToRecent(address)
    setShowSuggestions(false)
  }

  const handleRecentSelect = (address: string) => {
    onChange(address)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (value.trim()) {
        saveToRecent(value)
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleInputFocus = () => {
    setShowSuggestions(value.length > 0 || recentAddresses.length > 0)
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicks on suggestions
    setTimeout(() => {
      if (!e.relatedTarget?.closest('[data-suggestions-container]')) {
        setShowSuggestions(false)
      }
    }, 150)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={label} className="text-white flex items-center gap-2">
        {icon}
        {label}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
          disabled={disabled}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
          </div>
        )}
        
        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div 
            data-suggestions-container
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-black/90 backdrop-blur-md border border-white/20 rounded-md shadow-lg max-h-80 overflow-auto"
          >
            <Command>
              <CommandList>
                {/* Recent Addresses */}
                {recentAddresses.length > 0 && !value && (
                  <CommandGroup heading="Recent Addresses">
                    {recentAddresses.map((address, index) => (
                      <CommandItem
                        key={`recent-${index}`}
                        onSelect={() => handleRecentSelect(address)}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/10 text-white"
                      >
                        <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{address}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Address Suggestions */}
                {suggestions.length > 0 && (
                  <CommandGroup heading="Address Suggestions">
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.place_id}
                        onSelect={() => handleSuggestionSelect(suggestion)}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/10 text-white"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-[#59ff00]" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </div>
                        {suggestion.types.includes('establishment') && (
                          <div className="shrink-0 text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                            Business
                          </div>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Loading State */}
                {isLoading && (
                  <CommandEmpty>
                    <div className="text-center py-4 text-gray-400">
                      <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full mx-auto mb-2" />
                      Searching addresses...
                    </div>
                  </CommandEmpty>
                )}

                {/* No Results */}
                {!isLoading && value.length > 2 && suggestions.length === 0 && (
                  <CommandEmpty>
                    <div className="text-center py-4 text-gray-400">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div>No addresses found</div>
                      <div className="text-xs mt-1">Try entering more details</div>
                    </div>
                  </CommandEmpty>
                )}

                {/* Use Current Location Option */}
                <div className="border-t border-white/10 p-2">
                  <CommandItem
                    onSelect={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const { latitude, longitude } = position.coords
                            
                            // Use reverse geocoding to get readable address
                            try {
                              const response = await fetch('/api/geocode/reverse', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ lat: latitude, lng: longitude }),
                              })
                              
                              if (response.ok) {
                                const data = await response.json()
                                const address = data.address || `${latitude}, ${longitude}`
                                onChange(address)
                                saveToRecent(address)
                              } else {
                                // Fallback to coordinates if reverse geocoding fails
                                const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                                onChange(fallbackAddress)
                              }
                            } catch (error) {
                              console.error('Reverse geocoding failed:', error)
                              // Fallback to coordinates
                              const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                              onChange(fallbackAddress)
                            }
                            
                            setShowSuggestions(false)
                          },
                          (error) => {
                            console.error('Error getting location:', error)
                          }
                        )
                      }
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-white/10 text-white"
                  >
                    <Navigation className="h-4 w-4 text-blue-400" />
                    <span>Use current location</span>
                  </CommandItem>
                </div>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </div>
  )
} 