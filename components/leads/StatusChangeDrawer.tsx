"use client"

import { useState } from "react"
import { LeadStatus } from "@prisma/client"
import { formatStatusLabel } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusChangeDrawerProps {
  currentStatus: LeadStatus
  onStatusChange: (status: LeadStatus) => void
  isLoading?: boolean
  loadingStatus?: LeadStatus | null
}

export function StatusChangeDrawer({ 
  currentStatus, 
  onStatusChange, 
  isLoading, 
  loadingStatus 
}: StatusChangeDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleStatusChange = (status: LeadStatus) => {
    onStatusChange(status)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="link" 
          className="text-[#59ff00] hover:text-[#59ff00]/80 p-0 h-auto font-normal"
        >
          Change Status
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-black/25 backdrop-blur-lg border-white/20">
        <SheetHeader>
          <SheetTitle className="text-[#59ff00] text-center">Change Lead Status</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {Object.values(LeadStatus).map((status) => (
            <Button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isLoading || currentStatus === status}
              className={cn(
                "w-full h-16 relative flex items-center justify-center",
                "bg-white/10 hover:bg-white/20",
              )}
            >
              <Badge variant={status as any} className="text-base px-3 py-1.5">
                {formatStatusLabel(status)}
              </Badge>
              {isLoading && loadingStatus === status && (
                <Loader2 className="h-5 w-5 ml-2 animate-spin absolute right-4" />
              )}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
} 